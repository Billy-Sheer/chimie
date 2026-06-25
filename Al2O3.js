/* ======================================================
   Lecture des charges depuis les lignes M  CHG du Molfile
   ====================================================== */
function lireChargesMolfile(lignes) {
  var charges = {};

  for (var i = 0; i < lignes.length; i++) {
    if (lignes[i].startsWith("M  CHG")) {
      var parts = lignes[i].trim().split(/\s+/);
      var n = parseInt(parts[2], 10);

      var index = 3;
      for (var j = 0; j < n; j++) {
        var atomIndex = parseInt(parts[index], 10);
        var charge = parseInt(parts[index + 1], 10);
        charges[atomIndex] = charge;
        index += 2;
      }
    }
  }
  return charges;
}

/* ======================================================
   Fonction principale appelée par le bouton "Vérifier"
   ====================================================== */
function verifier() {

  var feedback = document.getElementById("feedback");
  feedback.innerHTML = "";

  var ketcher =
    document.getElementById("ketcherFrame").contentWindow.ketcher;

  ketcher.getMolfile().then(function (mol) {

    var lignes = mol.split("\n");

    /* --- Lecture des comptes --- */
    var counts = lignes[3].trim().split(/\s+/);
    var nbAtomes = parseInt(counts[0], 10);
    var nbLiaisons = parseInt(counts[1], 10);

    /* --- Lecture des symboles atomiques --- */
    var symboles = [];
    for (var i = 0; i < nbAtomes; i++) {
      var p = lignes[4 + i].trim().split(/\s+/);
      symboles.push(p[3]);
    }

    /* ==================================================
       1) Atomes autorisés : Al et O uniquement
       ================================================== */
    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] !== "Al" && symboles[i] !== "O") {
        feedback.innerHTML =
          "Ce composé ionique ne contient que des ions Al<sup>3+</sup> et O<sup>2-</sup>.";
        return;
      }
    }

    /* ==================================================
       2) Quantités : 2 Al et 3 O
       ================================================== */
    var nbAl = 0;
    var nbO = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "Al") nbAl++;
      if (symboles[i] === "O") nbO++;
    }

    if (nbAl !== 2 || nbO !== 3) {
      feedback.innerHTML =
        "Vous avez déterminé qu'il y a 2 ions Al<sup>3+</sup> et " +
        "3 ions O<sup>2-</sup>.<br>" +
        "Votre représentation doit en tenir compte.";
      return;
    }

    /* ==================================================
       3) Charges
       ================================================== */
    var charges = lireChargesMolfile(lignes);

    var chargePresente = false;
    for (i = 0; i < symboles.length; i++) {
      var atomIndex = i + 1;
      if (charges[atomIndex] !== undefined && charges[atomIndex] !== 0) {
        chargePresente = true;
      }
    }

    /* --- 3a) Aucune charge --- */
    if (!chargePresente) {
      feedback.innerHTML =
        "Ajoutez des charges aux atomes à l'aide de ces boutons " +
        "dans le menu de gauche.<br>" +
        "<img src='images/Img_boutons_charges_Ketcher.jpg'>";
      return;
    }

    /* --- 3b) Charges présentes mais incorrectes --- */
    for (i = 0; i < symboles.length; i++) {
      var atomIndex = i + 1;
      var charge = charges[atomIndex] || 0;

      if (symboles[i] === "Al" && charge !== 3) {
        feedback.innerHTML =
          "Les charges ont été ajoutées, mais elles ne correspondent pas aux ions " +
          "du composé Al<sub>2</sub>O<sub>3</sub>.<br>" +
          "Dans l'exercice précédent, vous avez déterminé que l'aluminium forme Al<sup>3+</sup> " +
          "et que l'oxygène forme O<sup>2-</sup>.";
        return;
      }

      if (symboles[i] === "O" && charge !== -2) {
        feedback.innerHTML =
          "Les charges ont été ajoutées, mais elles ne correspondent pas aux ions " +
          "du composé Al<sub>2</sub>O<sub>3</sub>.<br>" +
          "Dans l'exercice précédent, vous avez déterminé que l'aluminium forme Al<sup>3+</sup> " +
          "et que l'oxygène forme O<sup>2-</sup>.";
        return;
      }
    }

    /* ==================================================
       4) Absence de liaisons
       ================================================== */
    if (nbLiaisons > 0) {
      feedback.innerText =
        "Les ions d'un composé ionique ne sont pas liés entre eux.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */
    feedback.innerHTML =
      "Bravo ! Votre représentation du Al<sub>2</sub>O<sub>3</sub> séparé en ions Al<sup>3+</sup> et O<sup>2-</sup> est correcte";

    /* ==================================================
==================================================
       PONT JS → MOODLE (ÉLÉMENT 3)
       Écrit '1' dans l'unique champ NUMERICAL de la page
       ================================================== */
    var champsNumeriques = document.querySelectorAll("input[type='text']");
    if (champsNumeriques.length === 1) {
      champsNumeriques[0].value = "1";
    }
  });
}

