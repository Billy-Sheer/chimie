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
  for (var i = 0; i < symboles.length; i++) voisins[i + 1] = [];

  for (var l of liaisons) {
    voisins[l.a1].push({ atom: l.a2, type: l.type });
    voisins[l.a2].push({ atom: l.a1, type: l.type });
  }

  return voisins;
}

/* ===============================
   GÉNÉRAL
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

/* ===============================
   HYDROGÈNES
================================ */

function verifierHydrogenes(symboles) {
  if (symboles.includes("H")) {
    return "Ne pas afficher les hydrogènes.";
  }
  return null;
}

/* ===============================
   VALENCE
================================ */

function verifierValence(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {

    let s = symboles[i];
    let nb = 0;
    for (var v of voisins[i + 1]) nb += v.type;

    if (s === "C" && nb > 4) return "Un carbone a plus que 4 liens.";
    if (s === "O" && nb > 2) return "Vous avez un oxygène avec 3 liens.";
    if (s === "I" && nb !== 1) return "Un halogène fait toujours un seul lien.";
  }

  return null;
}

/* ===============================
   COMPTAGE
================================ */

function compter(symboles, s) {
  return symboles.filter(x => x === s).length;
}

/* ===============================
   STRUCTURE SPÉCIFIQUE
================================ */

function verifierStructure(symboles, liaisons) {

  // exactement une liaison triple C≡C
  let nCC3 = 0;
  for (var l of liaisons) {
    if (l.type === 3) {
      let a1 = symboles[l.a1 - 1];
      let a2 = symboles[l.a2 - 1];
      if (a1 === "C" && a2 === "C") nCC3++;
    }
  }

  if (nCC3 === 0) return "Il manque une liaison triple entre deux carbones.";
  if (nCC3 > 1) return "Il y a trop de liaisons triples entre les carbones.";

  // exactement une liaison C=O
  let nCO = 0;
  for (var l of liaisons) {
    if (l.type === 2) {
      let a1 = symboles[l.a1 - 1];
      let a2 = symboles[l.a2 - 1];
      if ((a1 === "C" && a2 === "O") || (a1 === "O" && a2 === "C")) nCO++;
    }
  }

  if (nCO === 0) return "Il manque une liaison double entre C et O.";
  if (nCO > 1) return "Il y a trop de liaisons doubles entre C et O.";

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

    for (var s of symboles) {
      if (!["C","O","I"].includes(s)) {
        feedback.innerHTML = "Il n'y a pas de " + s + " dans cette molécule.";
        return;
      }
    }

    if (compter(symboles,"C") !== 3) {
      feedback.innerHTML = "Le nombre d'atomes de carbone est incorrect.";
      return;
    }

    if (compter(symboles,"O") !== 1) {
      feedback.innerHTML = "Le nombre d'atomes d'oxygène est incorrect.";
      return;
    }

    if (compter(symboles,"I") !== 1) {
      feedback.innerHTML = "Le nombre d'atomes d'iode est incorrect.";
      return;
    }

    var errH = verifierHydrogenes(symboles);
    if (errH) {
      feedback.innerHTML = errH;
      return;
    }

    var errVal = verifierValence(symboles, voisins);
    if (errVal) {
      feedback.innerHTML = errVal;
      return;
    }

    var errStruct = verifierStructure(symboles, liaisons);
    if (errStruct) {
      feedback.innerHTML = errStruct;
      return;
    }

    feedback.innerHTML = "Bravo ! Votre structure est correcte.";

    var champs = document.querySelectorAll("input[type='text']");
    if (champs.length === 1) champs[0].value = "1";
  });
}