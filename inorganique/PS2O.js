/* ======================================================
   Lecture des charges depuis le Molfile
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
   PS₂O⁻ — Diagramme de Lewis
   Règle 2 + plausibilité
   ====================================================== */
function verifierPS2O() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration");
  feedback.innerHTML = "";
  illustration.style.display = "none";

  /* ==================================================
     QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (parseInt(valenceElectrons.value, 10) !== 24) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du PS₂O⁻ n’est pas correct.";
    return;
  }

  if (parseInt(doubletsCentraux.value, 10) !== 0) {
    feedback.innerHTML =
      "Règle 4 : réévaluez l’attribution des électrons à l’atome central.";
    return;
  }

  /* ==================================================
     LECTURE DU DESSIN KETCHER
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
       UNE SEULE MOLÉCULE
       ================================================== */

    var parents = {};
    for (var i = 1; i <= nbAtomes; i++) parents[i] = i;

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
        "Une seule molécule (ou un seul ion polyatomique) doit être représentée.";
      return;
    }

    /* ==================================================
       COMPOSITION ATOMIQUE
       ================================================== */

    var nbP = 0, nbS = 0, nbO = 0;
    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "P") nbP++;
      if (symboles[i] === "S") nbS++;
      if (symboles[i] === "O") nbO++;
      if (!["P", "S", "O"].includes(symboles[i])) {
        feedback.innerHTML =
          "La molécule PS₂O⁻ ne contient que des atomes P, S et O.";
        return;
      }
    }

    if (nbP !== 1 || nbS !== 2 || nbO !== 1) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule PS₂O⁻.";
      return;
    }

    /* ==================================================
       RÈGLE 2 — CENTRALITÉ
       ================================================== */

    var indexP = symboles.indexOf("P");
    var degres = new Array(nbAtomes).fill(0);

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      degres[parseInt(b[0], 10) - 1]++;
      degres[parseInt(b[1], 10) - 1]++;
    }

    if (degres[indexP] !== 3) {
      feedback.innerHTML =
        "Règle 2 : l’atome central n’est pas correctement choisi.";
      return;
    }

    /* ==================================================
       ANALYSE DES LIAISONS AUTOUR DE P
       ================================================== */

    var electronsAutourP = 0;
    var nbDoubles = 0;
    var nbTriples = 0;

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (a1 === indexP || a2 === indexP) {
        electronsAutourP += 2 * ordre;
        if (ordre === 2) nbDoubles++;
        if (ordre === 3) nbTriples++;
      }
    }

    /* ==================================================
       RÈGLE 5 — OCTET (UNIQUEMENT SI < 8)
       ================================================== */

    if (electronsAutourP < 8) {
      feedback.innerHTML =
        "Règle 5 : l’atome central n’atteint pas l’octet.";
      return;
    }

    /* ==================================================
       PLAUSIBILITÉ — TOUS LES CAS NON OPTIMAUX
       ================================================== */

    if (nbTriples > 0 || nbDoubles !== 2) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible.";
      return;
    }

    /* ==================================================
       CHARGES FORMELLES
       ================================================== */

    var charges = lireChargesMolfile(lignes);
    var chargePositive = false;
    var chargeNegative = false;
    var chargeSurO = false;
    var chargeSurS = false;

    for (var idx in charges) {
      var at = symboles[idx - 1];
      if (charges[idx] > 0) chargePositive = true;
      if (charges[idx] < 0) {
        chargeNegative = true;
        if (at === "O") chargeSurO = true;
        if (at === "S") chargeSurS = true;
      }
    }

    if (chargePositive || !chargeNegative || chargeSurS) {
      feedback.innerHTML =
        "Quand plusieurs représentations sont équivalentes au niveau des charges formelles, " +
        "on favorise la charge négative sur l’atome le plus électronégatif.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de PS₂O⁻ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}