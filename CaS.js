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
       1) Atomes autorisés : Ca et S uniquement
       ================================================== */
    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] !== "Ca" && symboles[i] !== "S") {
        feedback.innerHTML =
          "Ce composé ionique ne contient que des ions Ca<sup>2+</sup> et S<sup>2-</sup>.";
        return;
      }
    }

    /* ==================================================
       2) Quantités : 1 Ca et 1 S
       ================================================== */
    var nbCa = 0;
    var nbS = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "Ca") nbCa++;
      if (symboles[i] === "S") nbS++;
    }

    if (nbCa !== 1 || nbS !== 1) {
      feedback.innerHTML =
        "Vous avez déterminé qu'il y a 1 ion Ca<sup>2+</sup> et 1 ion S<sup>2-</sup>.<br>" +
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

      if (symboles[i] === "Ca" && charge !== 2) {
        feedback.innerHTML =
          "Les charges ont été ajoutées, mais elles ne correspondent pas aux ions " +
          "du composé CaS.<br>" +
          "Dans l'exercice précédent, vous avez déterminé que le Ca forme Ca<sup>2+</sup> et le S forme S<sup>2-</sup>.";
        return;
      }

      if (symboles[i] === "S" && charge !== -2) {
        feedback.innerHTML =
          "Les charges ont été ajoutées, mais elles ne correspondent pas aux ions " +
          "du composé CaS.<br>" +
          "Dans l'exercice précédent, vous avez déterminé que le Ca forme Ca<sup>2+</sup> et le S forme S<sup>2-</sup>.";
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
      "Bravo ! Votre représentation du CaS séparé en ions Ca<sup>2+</sup> et S<sup>2-</sup> est correcte";

    /* ==================================================
       PONT JS → MOODLE (ÉLÉMENT 3)
       Écrit '1' dans l'unique champ NUMERICAL de la page
       ================================================== */
    var champsNumeriques = document.querySelectorAll("input[type='text']");
    if (champsNumeriques.length === 1) {
      champsNumeriques[0].value = "1";
    }
  });
}