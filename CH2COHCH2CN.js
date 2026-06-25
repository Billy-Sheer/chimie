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

function verifierHydrogenes(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {

    if (symboles[i] === "H") {

      var vH = voisins[i + 1];

      if (vH.length !== 1) {
        return "Hydrogène mal placé.";
      }

      if (symboles[vH[0].atom - 1] !== "O") {
        return "Ne pas afficher les hydrogènes, sauf pour la liaison O–H.";
      }
    }
  }

  return null;
}

function presenceOH(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {
    if (symboles[i] === "O") {
      for (var v of voisins[i + 1]) {
        if (symboles[v.atom - 1] === "H") return true;
      }
    }
  }

  return false;
}

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

    if (s === "O" && nb > 2) {
      return "Vous avez un oxygène avec 3 liens.";
    }

    if (s === "N" && nb > 3) {
      return "L'azote a trop de liens.";
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

  // 1) Une liaison double C=C
  if (compterLiaisons(liaisons, 2) !== 1) {
    return "Il doit y avoir une seule liaison double entre deux carbones.";
  }

  // 2) Une liaison triple C≡N
  let nitrile = false;

  for (var l of liaisons) {
    if (l.type === 3) {
      let a1 = symboles[l.a1 - 1];
      let a2 = symboles[l.a2 - 1];
      if (
        (a1 === "C" && a2 === "N") ||
        (a1 === "N" && a2 === "C")
      ) {
        nitrile = true;
      }
    }
  }

  if (!nitrile) {
    return "Il doit y avoir une liaison triple entre C et N.";
  }

  // 3) Aucune liaison C=O
  for (var l of liaisons) {
    if (l.type === 2) {
      let a1 = symboles[l.a1 - 1];
      let a2 = symboles[l.a2 - 1];
      if (
        (a1 === "C" && a2 === "O") ||
        (a1 === "O" && a2 === "C")
      ) {
        return "Il ne doit pas y avoir de liaison double entre C et O.";
      }
    }
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

    var errH = verifierHydrogenes(symboles, voisins);
    if (errH) {
      feedback.innerHTML = errH;
      return;
    }

    if (!presenceOH(symboles, voisins)) {
      feedback.innerHTML = "Vous devez dessiner explicitement la liaison O–H.";
      return;
    }

    var errVal = verifierValence(symboles, voisins);
    if (errVal) {
      feedback.innerHTML = errVal;
      return;
    }

    for (var s of symboles) {
      if (!["C", "O", "N", "H"].includes(s)) {
        feedback.innerHTML = "Il n'y a pas de " + s + " dans cette molécule.";
        return;
      }
    }

    if (compter(symboles, "C") !== 4) {
      feedback.innerHTML = "Le nombre d'atomes de carbone est incorrect.";
      return;
    }

    if (compter(symboles, "O") !== 1) {
      feedback.innerHTML = "Le nombre d'atomes d'oxygène est incorrect.";
      return;
    }

    if (compter(symboles, "N") !== 1) {
      feedback.innerHTML = "Le nombre d'atomes d'azote est incorrect.";
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