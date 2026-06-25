/* ======================================================
   NHS — Diagramme de Lewis
   Règle 2 + plausibilité
   ====================================================== */
function verifierNHS() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration");
  feedback.innerHTML = "";
  illustration.style.display = "none";

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */
  var champElectrons = document.getElementById("valenceElectrons");
  var champDoublets = document.getElementById("doubletsCentraux");

  if (!champElectrons || !champDoublets) {
    feedback.innerHTML =
      "Erreur technique : les champs de réponse ne sont pas détectés.";
    return;
  }

  if (champElectrons.value === "" || champDoublets.value === "") {
    feedback.innerHTML =
      "Veuillez répondre aux questions de raisonnement avant de vérifier.";
    return;
  }

  if (parseInt(champElectrons.value, 10) !== 12) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du NHS n’est pas correct.";
    return;
  }

  if (parseInt(champDoublets.value, 10) !== 1) {
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
       3) UNE SEULE MOLÉCULE
       ================================================== */
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
        "Une seule molécule doit être représentée.";
      return;
    }

    /* ==================================================
       4) COMPOSITION ATOMIQUE
       ================================================== */
    var nbH = 0, nbN = 0, nbS = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "H") nbH++;
      if (symboles[i] === "N") nbN++;
      if (symboles[i] === "S") nbS++;
      if (!["H", "N", "S"].includes(symboles[i])) {
        feedback.innerHTML =
          "La molécule NHS ne contient que des atomes H, N et S.";
        return;
      }
    }

    if (nbH !== 1 || nbN !== 1 || nbS !== 1) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule NHS. " +
        "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       5) STRUCTURE SQUELETTIQUE — RÈGLE 2
       ================================================== */

    var indexN = symboles.indexOf("N");
    var indexS = symboles.indexOf("S");

    var degres = new Array(nbAtomes).fill(0);
    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      degres[parseInt(b[0], 10) - 1]++;
      degres[parseInt(b[1], 10) - 1]++;
    }

    // L’atome central est celui de degré 2
    var indexCentral = degres.indexOf(2);

    if (indexCentral !== indexS) {
      feedback.innerHTML =
        "Règle 2 : la structure squelettique est erronée.";
      return;
    }

    /* ==================================================
       6) ANALYSE DES LIAISONS S–N (PLAUSIBILITÉ)
       ================================================== */

    var nbSimples = 0;
    var nbDoubles = 0;
    var nbTriples = 0;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (
        (a1 === indexS && a2 === indexN) ||
        (a2 === indexS && a1 === indexN)
      ) {
        if (ordre === 1) nbSimples++;
        if (ordre === 2) nbDoubles++;
        if (ordre === 3) nbTriples++;
      }
    }

    // Cas S–N simple seulement → octet non atteint
    if (nbSimples === 1 && nbDoubles === 0 && nbTriples === 0) {
      feedback.innerHTML =
        "L’atome central n’atteint pas l’octet ; former des liaisons multiples.";
      return;
    }

    // Cas S=N (liaison double seule) → octet atteint mais structure moins plausible
    if (nbDoubles === 1 && nbTriples === 0) {
      feedback.innerHTML =
        "Ce n’est pas la structure la plus plausible.";
      return;
    }

    /* ==================================================
       SUCCÈS — LIAISON TRIPLE
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de NHS semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}