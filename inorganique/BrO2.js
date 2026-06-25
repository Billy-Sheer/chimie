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
function verifierBrO2() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (document.getElementById("valenceElectrons").value != 20) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du BrO₂⁻ n’est pas correct.";
    return;
  }

  if (document.getElementById("doubletsCentraux").value != 2) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central n’est pas correct.";
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
       3) UNE SEULE MOLÉCULE — DÉTECTION DES FRAGMENTS
       ================================================== */

    var adj = Array.from({ length: nbAtomes }, () => []);

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      adj[a1].push(a2);
      adj[a2].push(a1);
    }

    var visite = new Array(nbAtomes).fill(false);
    var composantes = 0;

    function dfs(i) {
      visite[i] = true;
      for (var j of adj[i]) {
        if (!visite[j]) dfs(j);
      }
    }

    for (i = 0; i < nbAtomes; i++) {
      if (!visite[i]) {
        dfs(i);
        composantes++;
      }
    }

    if (composantes !== 1) {
      feedback.innerHTML =
        "Une seule molécule doit être représentée.";
      return;
    }

    /* ==================================================
       4) COMPOSITION ATOMIQUE
       ================================================== */

    var nbBr = 0, nbO = 0;
    var indexBr = -1;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "Br") {
        nbBr++;
        indexBr = i;
      }
      else if (symboles[i] === "O") nbO++;
      else {
        feedback.innerHTML =
          "La molécule BrO₂⁻ ne contient que des atomes Br et O.";
        return;
      }
    }

    if (nbBr !== 1 || nbO !== 2) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule BrO₂⁻.";
      return;
    }

    /* ==================================================
       5) ANALYSE DES LIAISONS (PLAUSIBILITÉ)
       ================================================== */

    var nbDoubles = 0;
    var nbSimples = 0;
    var liaisonTriple = false;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (
        (a1 === indexBr && symboles[a2] === "O") ||
        (a2 === indexBr && symboles[a1] === "O")
      ) {
        if (ordre === 1) nbSimples++;
        if (ordre === 2) nbDoubles++;
        if (ordre === 3) liaisonTriple = true;
      }
    }

    if (liaisonTriple || nbDoubles !== 1 || nbSimples !== 1) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible.";
      return;
    }

    /* ==================================================
       6) CHARGES FORMELLES
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

        var estDoubleLie = false;
        var estSimpleLie = false;

        for (i = 0; i < nbLiaisons; i++) {
          b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
          a1 = parseInt(b[0], 10) - 1;
          a2 = parseInt(b[1], 10) - 1;
          ordre = parseInt(b[2], 10);

          if (
            ordre === 2 &&
            (
              (a1 === iAt && symboles[a2] === "Br") ||
              (a2 === iAt && symboles[a1] === "Br")
            )
          ) {
            estDoubleLie = true;
          }

          if (
            ordre === 1 &&
            (
              (a1 === iAt && symboles[a2] === "Br") ||
              (a2 === iAt && symboles[a1] === "Br")
            )
          ) {
            estSimpleLie = true;
          }
        }

        if (estDoubleLie || !estSimpleLie) {
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
      "Bravo ! La structure de Lewis de BrO₂⁻ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}