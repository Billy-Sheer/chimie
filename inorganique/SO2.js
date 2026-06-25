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

function verifierSO2() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ===============================
     Questions de raisonnement
     =============================== */

  var valence = parseInt(valenceElectrons.value, 10);
  var doubletsCentrauxN = parseInt(doubletsCentraux.value, 10);

  if (valence !== 18) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du SO₂ n’est pas correct.";
    return;
  }

  if (doubletsCentrauxN !== 1) {
    feedback.innerHTML =
      "Règle 4 : réévaluez l’attribution des électrons à l’atome central.";
    return;
  }

  /* ===============================
     Lecture du dessin Ketcher
     =============================== */

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

    /* ===============================
       Une seule molécule
       =============================== */

    var parents = {};
    for (i = 1; i <= nbAtomes; i++) parents[i] = i;

    function find(x) {
      return parents[x] === x ? x : parents[x] = find(parents[x]);
    }
    function unite(a, b) {
      parents[find(a)] = find(b);
    }

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      unite(parseInt(b[0], 10), parseInt(b[1], 10));
    }

    var racines = new Set();
    for (i = 1; i <= nbAtomes; i++) racines.add(find(i));

    if (racines.size > 1) {
      feedback.innerHTML =
        "Une seule molécule doit être représentée. Vérifiez que tous les atomes sont reliés.";
      return;
    }

    /* ===============================
       Composition atomique
       =============================== */

    var nbS = 0, nbO = 0;
    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "S") nbS++;
      if (symboles[i] === "O") nbO++;
      if (!["S", "O"].includes(symboles[i])) {
        feedback.innerHTML =
          "La molécule SO₂ ne contient que des atomes S et O.";
        return;
      }
    }

    if (nbS !== 1 || nbO !== 2) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule SO₂.";
      return;
    }

    /* ===============================
       Règle 2 — centralité
       =============================== */

    var indexS = symboles.indexOf("S");
    var degres = {};
    for (i = 0; i < nbAtomes; i++) degres[i] = 0;

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      degres[parseInt(b[0], 10) - 1]++;
      degres[parseInt(b[1], 10) - 1]++;
    }

    if (degres[indexS] !== 2) {
      feedback.innerHTML =
        "Règle 2 : l’atome central n’est pas correctement choisi.";
      return;
    }

    /* ===============================
       Calcul CORRIGÉ de l’octet
       =============================== */

    var electronsAutourS = 0;
    var nbDoubles = 0;
    var liaisonTriple = false;

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (a1 === indexS || a2 === indexS) {
        electronsAutourS += 2 * ordre;
        if (ordre === 2) nbDoubles++;
        if (ordre === 3) liaisonTriple = true;
      }
    }

    /* AJOUT DES DOUBLETS LIBRES SUR S */
    electronsAutourS += 2 * doubletsCentrauxN;

    /* ===============================
       Règle 5 — seulement si < 8
       =============================== */

    if (electronsAutourS < 8) {
      feedback.innerHTML =
        "Règle 5 : l’atome central n’atteint pas l’octet.";
      return;
    }

    /* ===============================
       Règle 6 — plausibilité
       =============================== */

    var charges = lireChargesMolfile(lignes);

    if (
      nbDoubles !== 2 ||
      liaisonTriple ||
      Object.keys(charges).length > 0
    ) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible.";
      return;
    }

    /* ===============================
       Succès
       =============================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de SO₂ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}