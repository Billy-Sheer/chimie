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
function verifierHSO3() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (document.getElementById("valenceElectrons").value != 26) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du HSO₃⁻ n’est pas correct.";
    return;
  }

  if (document.getElementById("doubletsCentraux").value != 1) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central (S) n’est pas correct.";
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

    var nbH = 0, nbS = 0, nbO = 0;
    var indexS = -1;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "H") nbH++;
      if (symboles[i] === "S") {
        nbS++;
        indexS = i;
      }
      if (symboles[i] === "O") nbO++;
    }

    if (nbH !== 1 || nbS !== 1 || nbO !== 3) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule HSO₃⁻." +
         "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       4) STRUCTURE SQUELETTIQUE COMPACTE
       ================================================== */

    var voisinsO = 0;
    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      if (a1 === indexS && symboles[a2] === "O") voisinsO++;
      if (a2 === indexS && symboles[a1] === "O") voisinsO++;
    }

    if (voisinsO !== 3) {
      feedback.innerHTML =
        "La structure squelettique n’est pas compacte.";
      return;
    }

    /* ==================================================
       5) RÈGLE DES OXACIDES (IDENTIQUE À HNO₃)
       ================================================== */

    var nbOH = 0;
    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;
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
       6) ANALYSE DES LIAISONS MULTIPLES
       ================================================== */

    var nbDoublesSO = 0;
    var liaisonTriple = false;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (
        ordre === 2 &&
        (
          (symboles[a1] === "S" && symboles[a2] === "O") ||
          (symboles[a2] === "S" && symboles[a1] === "O")
        )
      ) {
        nbDoublesSO++;
      }

      if (ordre === 3) {
        liaisonTriple = true;
      }
    }

    if (liaisonTriple || nbDoublesSO !== 1) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible.";
      return;
    }

    /* ==================================================
       7) CHARGES FORMELLES
       ================================================== */

    var charges = lireChargesMolfile(lignes);
    var chargeNegativeValide = false;

    for (var idx in charges) {
      var iAt = idx - 1;

      if (charges[idx] > 0) {
        feedback.innerHTML =
          "Ce n’est pas la structure la plus plausible.";
        return;
      }

      if (charges[idx] < 0) {

        if (symboles[iAt] !== "O") {
          feedback.innerHTML =
            "Vos charges formelles sont erronées.";
          return;
        }

        var estProtonne = false;
        var estDoubleLie = false;
        var estSimpleLie = false;

        for (i = 0; i < nbLiaisons; i++) {
          b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
          a1 = parseInt(b[0], 10) - 1;
          a2 = parseInt(b[1], 10) - 1;
          ordre = parseInt(b[2], 10);

          if (
            (a1 === iAt && symboles[a2] === "H") ||
            (a2 === iAt && symboles[a1] === "H")
          ) {
            estProtonne = true;
          }

          if (
            ordre === 2 &&
            (
              (a1 === iAt && symboles[a2] === "S") ||
              (a2 === iAt && symboles[a1] === "S")
            )
          ) {
            estDoubleLie = true;
          }

          if (
            ordre === 1 &&
            (
              (a1 === iAt && symboles[a2] === "S") ||
              (a2 === iAt && symboles[a1] === "S")
            )
          ) {
            estSimpleLie = true;
          }
        }

        if (estProtonne || estDoubleLie || !estSimpleLie) {
          feedback.innerHTML =
            "Vos charges formelles sont erronées.";
          return;
        }

        chargeNegativeValide = true;
      }
    }

    if (!chargeNegativeValide) {
      feedback.innerHTML =
        "Vos charges formelles sont erronées.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de HSO₃⁻ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}