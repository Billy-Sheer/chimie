/* ======================================================
   VALIDATION — H2SeO2 (avant octets étendus)
   ====================================================== */

function verifierH2SeO2() {

  var feedback = document.getElementById("feedback");
  var illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (document.getElementById("valenceElectrons").value != 20) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du H₂SeO₂ n’est pas correct.";
    return;
  }

  if (document.getElementById("doubletsCentraux").value != 2) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central (Se) n’est pas correct.";
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
       3) UNE SEULE MOLÉCULE (PAS DE FRAGMENTS)
       ================================================== */

    var adj = Array.from({ length: nbAtomes }, () => []);

    for (i = 0; i < nbLiaisons; i++) {
      var b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var a1 = parseInt(b[0], 10) - 1;
      var a2 = parseInt(b[1], 10) - 1;
      adj[a1].push(a2);
      adj[a2].push(a1);
    }

    var visite = new Array(nbAtomes).fill(false);
    var composantes = 0;

    function dfs(i) {
      visite[i] = true;
      for (var j of adj[i]) {
        if (!visite[j]) dfs(j);
      }
    }

    for (i = 0; i < nbAtomes; i++) {
      if (!visite[i]) {
        dfs(i);
        composantes++;
      }
    }

    if (composantes !== 1) {
      feedback.innerHTML =
        "Une seule molécule doit être représentée.";
      return;
    }

    /* ==================================================
       4) COMPOSITION ATOMIQUE
       ================================================== */

    var nbH = 0, nbSe = 0, nbO = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "H") nbH++;
      else if (symboles[i] === "Se") nbSe++;
      else if (symboles[i] === "O") nbO++;
      else {
        feedback.innerHTML =
          "La molécule H₂SeO₂ ne contient que des atomes H, Se et O.";
        return;
      }
    }

    if (nbH !== 2 || nbSe !== 1 || nbO !== 2) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule H₂SeO₂. " +
        "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       5) RÈGLE DES OXACIDES
       ================================================== */

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;

      if (
        (symboles[a1] === "H" && symboles[a2] === "Se") ||
        (symboles[a2] === "H" && symboles[a1] === "Se")
      ) {
        feedback.innerHTML =
          "Oxacides : les H sont liés à O.";
        return;
      }
    }

    /* ==================================================
       6) ATOME CENTRAL
       ================================================== */

    var liaisonsSe = 0;

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      a1 = parseInt(b[0], 10) - 1;
      a2 = parseInt(b[1], 10) - 1;

      if (symboles[a1] === "Se" || symboles[a2] === "Se") {
        liaisonsSe++;
      }
    }

    if (liaisonsSe < 2) {
      feedback.innerHTML =
        "Rappelez‑vous : dans un oxacide, l’atome central est lié aux atomes d’oxygène.";
      return;
    }

    /* ==================================================
       7) LIAISONS MULTIPLES (INTERDITES ICI)
       ================================================== */

    for (i = 0; i < nbLiaisons; i++) {
      b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      var ordre = parseInt(b[2], 10);

      if (ordre !== 1) {
        feedback.innerHTML =
          "Votre structure squelettique est erronée.";
        return;
      }
    }

    /* ==================================================
       8) CHARGES FORMELLES (INTERDITES)
       ================================================== */

    for (i = 0; i < lignes.length; i++) {
      if (lignes[i].startsWith("M  CHG")) {
        feedback.innerHTML =
          "Il n’y a pas de charges sur cette molécule.";
        return;
      }
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La structure de Lewis de H₂SeO₂ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}