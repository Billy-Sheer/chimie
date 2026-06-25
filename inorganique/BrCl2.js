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
   Fonction principale — BrCl2−
   ====================================================== */
function verifier() {

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

  if (parseInt(champElectrons.value, 10) !== 22) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du BrCl₂⁻ n’est pas correct.";
    return;
  }

  if (parseInt(champDoublets.value, 10) !== 3) {
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
       3) UNE SEULE MOLÉCULE (GESTION DES FRAGMENTS)
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
        "Une seule molécule (ou un seul ion polyatomique) doit être représentée. " +
        "Vérifiez que tous les atomes sont reliés entre eux dans Ketcher.";
      return;
    }

    /* ==================================================
       4) COMPOSITION ATOMIQUE
       ================================================== */

    var nbBr = 0, nbCl = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "Br") nbBr++;
      if (symboles[i] === "Cl") nbCl++;
      if (!["Br", "Cl"].includes(symboles[i])) {
        feedback.innerHTML =
          "La molécule BrCl₂⁻ ne contient que des atomes Br et Cl.";
        return;
      }
    }

    if (nbBr !== 1 || nbCl !== 2) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule BrCl₂⁻.";
      return;
    }

    /* ==================================================
       5) STRUCTURE SQUELETTIQUE (Br CENTRAL)
       ================================================== */

    var indexBr = symboles.indexOf("Br");
    var voisinsCl = 0;

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      var ordre = parseInt(b[2], 10);

      if (ordre !== 1) {
        feedback.innerHTML =
          "La structure de BrCl₂⁻ ne comporte que des liaisons simples.";
        return;
      }

      if (
        (a1 === indexBr && symboles[a2] === "Cl") ||
        (a2 === indexBr && symboles[a1] === "Cl")
      ) {
        voisinsCl++;
      }
    }

    if (voisinsCl !== 2) {
      feedback.innerHTML =
        "L’électronégativité de l’atome central est inférieure à celle des atomes périphériques";
      return;
    }

    /* ==================================================
       6) CHARGES FORMELLES (NON DIRECTIF)
       ================================================== */

    var charges = lireChargesMolfile(lignes);
    var chargeTrouvee = false;
    var chargeBrNegative = false;

    for (var idx in charges) {
      chargeTrouvee = true;
      var iAt = idx - 1;

      if (symboles[iAt] === "Br" && charges[idx] === -1) {
        chargeBrNegative = true;
      }
    }

    if (!chargeTrouvee) {
      feedback.innerHTML =
        "Il y a une charge formelle à ajouter.";
      return;
    }

    if (!chargeBrNegative) {
      feedback.innerHTML =
        "Vos charges formelles sont erronées.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de BrCl₂⁻ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}