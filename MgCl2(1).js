function chargeReelle(code) {
    if (code === 1) return 3;
    if (code === 2) return 2;
    if (code === 3) return 1;
    if (code === 5) return -1;
    if (code === 6) return -2;
    if (code === 7) return -3;
    return 0;
  }
  
  function verifier() {
    var feedback = document.getElementById("feedback");
    feedback.innerHTML = "";
  
    var ketcher =
      document.getElementById("ketcherFrame").contentWindow.ketcher;
  
    ketcher.getMolfile().then(function (mol) {
      var lignes = mol.split("\n");
      var counts = lignes[3].trim().split(/\s+/);
      var nbAtomes = parseInt(counts[0], 10);
      var nbLiaisons = parseInt(counts[1], 10);
  
      var symboles = [];
      var codesCharge = [];
  
      for (var i = 0; i < nbAtomes; i++) {
        var p = lignes[4 + i].trim().split(/\s+/);
        symboles.push(p[3]);
        codesCharge.push(parseInt(p[5], 10));
      }
  
      // 1) Atomes autorises
      for (i = 0; i < symboles.length; i++) {
        if (symboles[i] !== "Mg" && symboles[i] !== "Cl") {
          feedback.innerText =
            "Ce compose ionique ne contient que des ions Mg et Cl.";
          return;
        }
      }
  
      // 2) Quantites
      var nbMg = 0;
      var nbCl = 0;
  
      for (i = 0; i < symboles.length; i++) {
        if (symboles[i] === "Mg") nbMg++;
        if (symboles[i] === "Cl") nbCl++;
      }
  
      if (nbMg !== 1 || nbCl !== 2) {
        feedback.innerHTML =
          "Vous avez determine qu'il y a 1 ion Mg<sup>2+</sup> et " +
          "2 ions Cl<sup>-</sup>.<br>" +
          "Votre representation doit en tenir compte.";
        return;
      }
  
      // 3) Charges
      for (i = 0; i < symboles.length; i++) {
        var charge = chargeReelle(codesCharge[i]);
  
        if (symboles[i] === "Mg" && charge !== 2) {
          feedback.innerHTML =
            "Ajoutez des charges aux atomes a l'aide de ces boutons " +
            "dans le menu de gauche.<br>" +
            "<img src='images/Img_boutons_charges_Ketcher.jpg'>";
          return;
        }
  
        if (symboles[i] === "Cl" && charge !== -1) {
          feedback.innerHTML =
            "Ajoutez des charges aux atomes a l'aide de ces boutons " +
            "dans le menu de gauche.<br>" +
            "<img src='images/Img_boutons_charges_Ketcher.jpg'>";
          return;
        }
      }
  
      // 4) Liaisons
      if (nbLiaisons > 0) {
        feedback.innerText =
          "Les ions d'un compose ionique ne sont pas lies entre eux.";
        return;
      }
  
      // SUCCES
      feedback.innerHTML =
        "Representation correcte des ions Mg<sup>2+</sup> et Cl<sup>-</sup> " +
        "separes dans le MgCl<sub>2</sub>.";
    });
  }