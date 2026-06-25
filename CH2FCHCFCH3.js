function analyserMol(mol) {

  var lignes = mol.split("\n");

  var counts = lignes[3].trim().split(/\s+/);
  var nbAtomes = parseInt(counts[0], 10);
  var nbLiaisons = parseInt(counts[1], 10);

  var symboles = [];
  for (var i = 0; i < nbAtomes; i++) {
    var p = lignes[4 + i].trim().split(/\s+/);
    symboles.push(p[3]);
  }

  var liaisons = [];
  for (var i = 0; i < nbLiaisons; i++) {
    var p = lignes[4 + nbAtomes + i].trim().split(/\s+/);
    liaisons.push({
      a1: parseInt(p[0]),
      a2: parseInt(p[1]),
      type: parseInt(p[2]) // 1 simple, 2 double, 3 triple
    });
  }

  return { symboles, liaisons };
}

function construireVoisins(symboles, liaisons) {

  var voisins = {};
  for (var i = 0; i < symboles.length; i++) {
    voisins[i + 1] = [];
  }

  for (var l of liaisons) {
    voisins[l.a1].push({ atom: l.a2, type: l.type });
    voisins[l.a2].push({ atom: l.a1, type: l.type });
  }

  return voisins;
}

/* ===============================
   VALIDATIONS DE BASE
================================ */

function uneSeuleMolecule(symboles, voisins) {

  var visites = new Set();

  function dfs(a) {
    visites.add(a);
    for (var v of voisins[a]) {
      if (!visites.has(v.atom)) dfs(v.atom);
    }
  }

  dfs(1);
  return visites.size === symboles.length;
}

function verifierHydrogenes(symboles) {
  if (symboles.includes("H")) {
    return "Ne pas afficher les hydrogènes dans cette molécule.";
  }
  return null;
}

/* ===============================
   VALENCE (avec règle halogènes)
================================ */

function verifierValence(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {

    let s = symboles[i];
    let nb = 0;

    for (var v of voisins[i + 1]) {
      nb += v.type;
    }

    if (s === "C" && nb > 4) {
      return "Un carbone a plus que 4 liens.";
    }

    if (s === "F" && nb !== 1) {
      return "Un halogène fait toujours un seul lien.";
    }

    if (s === "H" && nb !== 1) {
      return "L’hydrogène fait toujours un seul lien.";
    }
  }

  return null;
}

/* ===============================
   COMPTAGES
================================ */

function compter(symboles, sym) {
  return symboles.filter(s => s === sym).length;
}

function compterLiaisons(liaisons, type) {
  return liaisons.filter(l => l.type === type).length;
}

/* ===============================
   STRUCTURE SPÉCIFIQUE
================================ */

function verifierStructure(symboles, voisins, liaisons) {

  // 1) Une seule liaison double
  if (compterLiaisons(liaisons, 2) !== 1) {
    return "Il doit y avoir une seule liaison double entre deux carbones.";
  }

  // 2) Aucune liaison triple
  if (compterLiaisons(liaisons, 3) !== 0) {
    return "Il ne doit pas y avoir de liaison triple dans cette molécule.";
  }

  // 3) Deux fluor sur deux carbones différents
  let carbonesAvecF = [];

  for (var i = 0; i < symboles.length; i++) {
    if (symboles[i] === "C") {
      for (var v of voisins[i + 1]) {
        if (symboles[v.atom - 1] === "F") {
          carbonesAvecF.push(i + 1);
        }
      }
    }
  }

  if (carbonesAvecF.length !== 2 || carbonesAvecF[0] === carbonesAvecF[1]) {
    return "Les deux fluor doivent être sur deux carbones différents.";
  }

  return null;
}

/* ===============================
   FONCTION PRINCIPALE
================================ */

function verifier() {

  var feedback = document.getElementById("feedback");
  feedback.innerHTML = "";

  var ketcher = document.getElementById("ketcherFrame").contentWindow.ketcher;

  ketcher.getMolfile().then(function (mol) {

    var data = analyserMol(mol);
    var symboles = data.symboles;
    var liaisons = data.liaisons;
    var voisins = construireVoisins(symboles, liaisons);

    if (!uneSeuleMolecule(symboles, voisins)) {
      feedback.innerHTML = "Vous avez dessiné plusieurs molécules.";
      return;
    }

    var errH = verifierHydrogenes(symboles);
    if (errH) {
      feedback.innerHTML = errH;
      return;
    }

    for (var s of symboles) {
      if (!["C", "F"].includes(s)) {
        feedback.innerHTML = "Il n'y a pas de " + s + " dans cette molécule.";
        return;
      }
    }

    if (compter(symboles, "C") !== 4) {
      feedback.innerHTML = "Le nombre d'atomes de carbone est incorrect.";
      return;
    }

    if (compter(symboles, "F") !== 2) {
      feedback.innerHTML = "Le nombre d'atomes de fluor est incorrect.";
      return;
    }

    var errVal = verifierValence(symboles, voisins);
    if (errVal) {
      feedback.innerHTML = errVal;
      return;
    }

    var errStruct = verifierStructure(symboles, voisins, liaisons);
    if (errStruct) {
      feedback.innerHTML = errStruct;
      return;
    }

    /* SUCCÈS */
    feedback.innerHTML = "Bravo ! Votre structure est correcte.";

    var champs = document.querySelectorAll("input[type='text']");
    if (champs.length === 1) {
      champs[0].value = "1";
    }
  });
}