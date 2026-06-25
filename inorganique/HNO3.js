/* ======================================================
   Lecture des charges depuis les lignes M  CHG du Molfile
   ====================================================== */
function lireChargesMolfile(lignes) {
  var charges = {};
  for (var i = 0; i < lignes.length; i++) {
    if (lignes[i].startsWith("M  CHG")) {
      var p = lignes[i].trim().split(/\s+/);
      var n = parseInt(p[2], 10);
      var k = 3;
      for (var j = 0; j < n; j++) {
        charges[parseInt(p[k], 10)] = parseInt(p[k + 1], 10);
        k += 2;
      }
    }
  }
  return charges;
}

/* ======================================================
   Fonction principale
   ====================================================== */
function verifier() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (document.getElementById("valenceElectrons").value != 24) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du HNO<sub>3</sub> n’est pas correct.";
    return;
  }

  if (document.getElementById("doubletsCentraux").value != 0) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central (N) n’est pas correct. " +
      "Référez‑vous à l’étape 4 de la méthode de construction d’un diagramme de Lewis.";
    return;
  }

  /* ==================================================
     2) LECTURE DU DESSIN KETCHER
     ================================================== */

  var ketcher =
    document.getElementById("ketcherFrame").contentWindow.ketcher;

  ketcher.getMolfile().then(function (mol) {

    var lignes = mol.split("\n");
    var counts = lignes[3].trim().split(/\s+/);
    var nbAtomes = parseInt(counts[0], 10);
    var nbLiaisons = parseInt(counts[1], 10);

    var symboles = [];
    for (var i = 0; i < nbAtomes; i++) {
      symboles.push(lignes[4 + i].trim().split(/\s+/)[3]);
    }

    /* ==================================================
       3) COMPOSITION ATOMIQUE
       ================================================== */

    var nbH = 0, nbN = 0, nbO = 0;
    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "H") nbH++;
      if (symboles[i] === "N") nbN++;
      if (symboles[i] === "O") nbO++;
    }

    if (nbH !== 1 || nbN !== 1 || nbO !== 3) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule HNO<sub>3</sub>. " +
        "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       4) STRUCTURE SQUELETTIQUE COMPACTE
       ================================================== */

    var indexN = symboles.indexOf("N");
    var voisinsO = 0;

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      if (a1 === indexN && symboles[a2] === "O") voisinsO++;
      if (a2 === indexN && symboles[a1] === "O") voisinsO++;
    }

    if (voisinsO !== 3) {
      feedback.innerHTML =
        "La structure squelettique n’est pas compacte.";
      return;
    }

    /* ==================================================
       5) RÈGLE DES OXACIDES (PRIORITAIRE)
       ================================================== */

    var nbOH = 0;

    for (var j = 0; j < nbLiaisons; j++) {
      var b = lignes[4 + nbAtomes + j].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;

      if (
        (symboles[a1] === "O" && symboles[a2] === "H") ||
        (symboles[a2] === "O" && symboles[a1] === "H")
      ) {
        nbOH++;
      }
    }

    if (nbOH !== 1) {
      feedback.innerHTML =
        "Oxacides : les H sont liés à O.";
      return;
    }

    /* ==================================================
       6) OXYGÈNES : MAXIMUM DE 2 LIAISONS
       ================================================== */

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "O") {
        var ordreTotal = 0;
        for (j = 0; j < nbLiaisons; j++) {
          var b = lignes[4 + nbAtomes + j].trim().split(/\s+/);
          var a1 = parseInt(b[0], 10) - 1;
          var a2 = parseInt(b[1], 10) - 1;
          var ordre = parseInt(b[2], 10);
          if (a1 === i || a2 === i) ordreTotal += ordre;
        }
        if (ordreTotal > 2) {
          feedback.innerHTML =
            "Ce n'est pas la représentation la plus plausible";
          return;
        }
      }
    }

    /* ==================================================
       7) OCTET STRICT SUR L’AZOTE
       ================================================== */

    var ordreN = 0;
    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);
      if (a1 === indexN || a2 === indexN) ordreN += ordre;
    }

    if (ordreN < 4) {
      feedback.innerHTML =
        "L’atome central n’atteint pas l’octet.";
      return;
    }
    if (ordreN > 4) {
      feedback.innerHTML =
        "L’atome central dépasse l’octet. Les éléments de la 2ᵉ période ne dépassent jamais l’octet.";
      return;
    }

    /* ==================================================
       8) CHARGES FORMELLES — DISPOSITION PLAUSIBLE
       ================================================== */

    var charges = lireChargesMolfile(lignes);
    var chargeNPositive = false;
    var chargeONegativeValide = false;

    for (var idx in charges) {
      var iAt = idx - 1;

      if (symboles[iAt] === "N" && charges[idx] > 0) {
        chargeNPositive = true;
      }

      if (symboles[iAt] === "O" && charges[idx] < 0) {

        var estLieSimpleAN = false;

        for (j = 0; j < nbLiaisons; j++) {
          var b = lignes[4 + nbAtomes + j].trim().split(/\s+/);
          var a1 = parseInt(b[0], 10) - 1;
          var a2 = parseInt(b[1], 10) - 1;
          var ordre = parseInt(b[2], 10);

          if (
            ordre === 2 &&
            (
              (a1 === iAt && symboles[a2] === "N") ||
              (a2 === iAt && symboles[a1] === "N")
            )
          ) {
            feedback.innerHTML =
              "La disposition des charges ne correspond pas au diagramme le plus plausible.";
            return;
          }

          if (
            ordre === 1 &&
            (
              (a1 === iAt && symboles[a2] === "N") ||
              (a2 === iAt && symboles[a1] === "N")
            )
          ) {
            estLieSimpleAN = true;
          }

          if (
            (a1 === iAt && symboles[a2] === "H") ||
            (a2 === iAt && symboles[a1] === "H")
          ) {
            feedback.innerHTML =
              "La disposition des charges ne correspond pas au diagramme le plus plausible.";
            return;
          }
        }

        if (!estLieSimpleAN) {
          feedback.innerHTML =
            "La disposition des charges ne correspond pas au diagramme le plus plausible.";
          return;
        }

        chargeONegativeValide = true;
      }
    }

    if (!chargeNPositive || !chargeONegativeValide) {
      feedback.innerHTML =
        "La disposition des charges ne correspond pas au diagramme le plus plausible.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de HNO<sub>3</sub> semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}