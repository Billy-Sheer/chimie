/* ======================================================
   Lecture des charges depuis les lignes M  CHG
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
   Validation du diagramme de Lewis — HBrO3
   ====================================================== */
function verifierHBrO3() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration");

  feedback.innerHTML = "";
  illustration.style.display = "none";

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (parseInt(valenceElectrons.value, 10) !== 26) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du HBrO₃ n’est pas correct.";
    return;
  }

  if (parseInt(doubletsCentraux.value, 10) !== 1) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central (Br) n’est pas correct.";
    return;
  }

  /* ==================================================
     2) LECTURE KETCHER
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
       3) UNE SEULE MOLÉCULE
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

    var nbH = 0, nbBr = 0, nbO = 0;
    var indexBr = -1;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "H") nbH++;
      else if (symboles[i] === "Br") {
        nbBr++;
        indexBr = i;
      }
      else if (symboles[i] === "O") nbO++;
      else {
        feedback.innerHTML =
          "La molécule HBrO₃ ne contient que des atomes H, Br et O.";
        return;
      }
    }

    if (nbH !== 1 || nbBr !== 1 || nbO !== 3) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule HBrO₃." +
        "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       5) RÈGLE DES OXACIDES
       ================================================== */

    var nbHO = 0;
    var hMalPlace = false;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;

      if (
        (symboles[a1] === "H" && symboles[a2] === "O") ||
        (symboles[a2] === "H" && symboles[a1] === "O")
      ) nbHO++;

      if (
        (symboles[a1] === "H" && symboles[a2] !== "O") ||
        (symboles[a2] === "H" && symboles[a1] !== "O")
      ) hMalPlace = true;
    }

    if (nbHO !== 1 || hMalPlace) {
      feedback.innerHTML =
        "Oxacides : les H sont liés à O";
      return;
    }

    /* ==================================================
       6) STRUCTURE SQUELETTIQUE — BR CENTRAL (NON LINÉAIRE)
       ================================================== */

    var voisinsBr = [];

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;

      if (a1 === indexBr) voisinsBr.push(a2);
      if (a2 === indexBr) voisinsBr.push(a1);
    }

    if (voisinsBr.length !== 3) {
      feedback.innerHTML =
        "La structure squelettique est incorrecte : structure compacte, non linéaire.";
      return;
    }

    /* ==================================================
       7) DEGRÉS ADMISSIBLES
       ================================================== */

    var degres = new Array(nbAtomes).fill(0);
    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      degres[parseInt(b[0], 10) - 1]++;
      degres[parseInt(b[1], 10) - 1]++;
    }

    for (i = 0; i < nbAtomes; i++) {
      if (
        (symboles[i] === "H" && degres[i] > 1) ||
        (symboles[i] === "O" && degres[i] > 2) ||
        (symboles[i] === "Br" && degres[i] > 3)
      ) {
        feedback.innerHTML =
          "Votre structure squelettique est erronée.";
        return;
      }
    }

    /* ==================================================
       8) PLAUSIBILITÉ — LIAISONS DOUBLES Br=O
       ================================================== */

    var doublesBrO = 0;
    var liaisonTriple = false;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (ordre === 3) liaisonTriple = true;

      if (
        ordre === 2 &&
        (
          (symboles[a1] === "Br" && symboles[a2] === "O") ||
          (symboles[a2] === "Br" && symboles[a1] === "O")
        )
      ) doublesBrO++;
    }

    if (liaisonTriple || doublesBrO !== 2) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible pour HBrO₃.";
      return;
    }

    /* ==================================================
       9) CHARGES FORMELLES — STRUCTURE NEUTRE
       ================================================== */

    var charges = lireChargesMolfile(lignes);

    for (var idx in charges) {
      if (charges[idx] !== 0) {
        feedback.innerHTML =
          "Vos charges formelles sont erronées.";
        return;
      }
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de HBrO₃ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}