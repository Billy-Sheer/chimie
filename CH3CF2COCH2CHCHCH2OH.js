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
      type: parseInt(p[2])
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

/* =============================== */

function trouverChaineCarbone(symboles, voisins) {

  var carbones = [];

  for (var i = 0; i < symboles.length; i++) {
    if (symboles[i] === "C") carbones.push(i + 1);
  }

  function dfs(chemin) {

    if (chemin.length === 7) return chemin;

    var dernier = chemin[chemin.length - 1];

    for (var v of voisins[dernier]) {

      if (symboles[v.atom - 1] !== "C") continue;
      if (chemin.includes(v.atom)) continue;

      var res = dfs([...chemin, v.atom]);
      if (res) return res;
    }

    return null;
  }

  for (var c of carbones) {
    var res = dfs([c]);
    if (res) return res;
  }

  return null;
}

/* =============================== */

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

/* =============================== */

function verifierHydrogenes(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {

    if (symboles[i] === "H") {

      var vH = voisins[i + 1];

      if (vH.length !== 1) return "Hydrogène mal placé.";

      var voisin = vH[0].atom;

      if (symboles[voisin - 1] !== "O") {
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

/* =============================== */

function verifierNombreLiaisons(symboles, voisins) {

  for (var i = 0; i < symboles.length; i++) {

    let s = symboles[i];
    let nb = 0;

    for (var v of voisins[i + 1]) {
      nb += v.type;
    }

    if (s === "O" && nb > 2) {
      return "Vous avez un oxygène avec 3 liens.";
    }

    if (s === "C" && nb > 4) {
      return "Un carbone a plus que 4 liens.";
    }
  }

  return null;
}

/* =============================== */

function compterCeqO(symboles, liaisons) {

  let count = 0;

  for (var l of liaisons) {
    if (l.type === 2) {

      var a1 = symboles[l.a1 - 1];
      var a2 = symboles[l.a2 - 1];

      if ((a1 === "C" && a2 === "O") || (a1 === "O" && a2 === "C")) {
        count++;
      }
    }
  }

  return count;
}

function compterDoubleCC(symboles, liaisons) {

  let count = 0;

  for (var l of liaisons) {
    if (l.type === 2) {

      var a1 = symboles[l.a1 - 1];
      var a2 = symboles[l.a2 - 1];

      if (a1 === "C" && a2 === "C") {
        count++;
      }
    }
  }

  return count;
}

/* =============================== */

function analyserStructure(chaine, symboles, voisins, liaisons) {

  function tester(ord) {

    let erreurs = [];

    let c2 = ord[1];
    let countF = 0;
    let liaisonMultiple = false;

    for (var v of voisins[c2]) {
      if (symboles[v.atom - 1] === "F") countF++;
      if (v.type !== 1) liaisonMultiple = true;
    }

    if (countF !== 2) {
      erreurs.push("Les deux fluor ne sont pas sur le carbone 2.");
    }

    if (liaisonMultiple) {
      erreurs.push("Le carbone 2 a plus que 4 liens.");
    }

    let c3 = ord[2];
    let okCO = false;

    for (var l of liaisons) {
      if (l.type === 2) {
        if (
          (l.a1 === c3 && symboles[l.a2 - 1] === "O") ||
          (l.a2 === c3 && symboles[l.a1 - 1] === "O")
        ) {
          okCO = true;
        }
      }
    }

    if (!okCO) {
      erreurs.push("La liaison double C=O doit être sur le carbone 3.");
    }

    let c5 = ord[4];
    let c6 = ord[5];
    let okCC = false;

    for (var l of liaisons) {
      if (
        l.type === 2 &&
        ((l.a1 === c5 && l.a2 === c6) ||
         (l.a1 === c6 && l.a2 === c5))
      ) {
        okCC = true;
      }
    }

    if (!okCC) {
      erreurs.push("La double liaison C=C doit être entre les carbones 5 et 6.");
    }

    let c7 = ord[6];
    let okOH = false;

    for (var v of voisins[c7]) {
      if (symboles[v.atom - 1] === "O") {
        for (var v2 of voisins[v.atom]) {
          if (symboles[v2.atom - 1] === "H") {
            okOH = true;
          }
        }
      }
    }

    if (!okOH) {
      erreurs.push("Le groupe O–H doit être sur le carbone 7.");
    }

    return erreurs;
  }

  let e1 = tester(chaine);
  let e2 = tester([...chaine].reverse());

  return e1.length <= e2.length ? e1 : e2;
}

/* =============================== */

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

    var erreurH = verifierHydrogenes(symboles, voisins);
    if (erreurH) {
      feedback.innerHTML = erreurH;
      return;
    }

    if (!presenceOH(symboles, voisins)) {
      feedback.innerHTML = "Vous devez dessiner explicitement la liaison O–H.";
      return;
    }

    var erreurValence = verifierNombreLiaisons(symboles, voisins);
    if (erreurValence) {
      feedback.innerHTML = erreurValence;
      return;
    }

    for (var l of liaisons) {
      if (l.type === 3) {
        feedback.innerHTML = "Il n’y a pas de liaison triple ici.";
        return;
      }
    }

    for (var s of symboles) {
      if (!["C","O","F","H"].includes(s)) {
        feedback.innerHTML = "Il n'y a pas de " + s + " dans cette molécule.";
        return;
      }
    }

    var nC = symboles.filter(s => s === "C").length;
    var nO = symboles.filter(s => s === "O").length;
    var nF = symboles.filter(s => s === "F").length;

    if (nC !== 7) {
      feedback.innerHTML = "Le nombre d'atomes de carbone est incorrect.";
      return;
    }

    if (nO !== 2) {
      feedback.innerHTML = "Le nombre d'atomes d'oxygène est incorrect.";
      return;
    }

    if (nF !== 2) {
      feedback.innerHTML = "Le nombre d'atomes de fluor est incorrect.";
      return;
    }

    var nCO = compterCeqO(symboles, liaisons);

    if (nCO === 0) {
      feedback.innerHTML = "Il manque une liaison double entre C et O.";
      return;
    }

    if (nCO > 1) {
      feedback.innerHTML = "Vous avez un oxygène avec 3 liens.";
      return;
    }

    var nCC = compterDoubleCC(symboles, liaisons);

    if (nCC !== 1) {
      feedback.innerHTML = "Il doit y avoir une seule liaison double entre les carbones.";
      return;
    }

    var chaine = trouverChaineCarbone(symboles, voisins);

    if (!chaine) {
      feedback.innerHTML = "La chaîne de 7 carbones est incorrecte.";
      return;
    }

    let erreurs = analyserStructure(chaine, symboles, voisins, liaisons);

    if (erreurs.length > 0) {

      if (erreurs.length === 1) {
        feedback.innerHTML = erreurs[0];
      } else {
        feedback.innerHTML =
          erreurs.join("<br>") +
          "<br><br><b>Vous y êtes presque.</b><br>" +
          "Vérifiez la position des atomes et des liaisons.<br>" +
          "Regardez la structure de Lewis que vous avez dessinée.";
      }

      return;
    }

    feedback.innerHTML = "Bravo ! Votre structure est correcte.";

    var champs = document.querySelectorAll("input[type='text']");
    if (champs.length === 1) {
      champs[0].value = "1";
    }

  });
}