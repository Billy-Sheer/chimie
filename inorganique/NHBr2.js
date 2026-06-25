function verifierNHBr2() {

  var feedback = document.getElementById("feedback");
  feedback.innerHTML = "";

  /* ==================================================
     1) QUESTIONS DE RAISONNEMENT
     ================================================== */

  if (parseInt(valenceElectrons.value, 10) !== 20) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence du NHBr₂ n’est pas correct.";
    return;
  }

  if (parseInt(doubletsCentraux.value, 10) !== 1) {
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
        "Une seule molécule doit être représentée. " +
        "Tous les atomes doivent être reliés par des liaisons. " +
        "Revoyez la vidéo.";
      return;
    }

    /* ==================================================
       4) COMPOSITION ATOMIQUE
       ================================================== */

    var nbN = 0, nbH = 0, nbBr = 0;

    for (i = 0; i < symboles.length; i++) {
      if (symboles[i] === "N") nbN++;
      else if (symboles[i] === "H") nbH++;
      else if (symboles[i] === "Br") nbBr++;
      else {
        feedback.innerHTML =
          "La molécule NHBr₂ ne contient que des atomes N, H et Br.";
        return;
      }
    }

    if (nbN !== 1 || nbH !== 1 || nbBr !== 2) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule NHBr₂. " +
        "(Rappelez‑vous : un hydrogène non relié par une liaison est ignoré par la correction, même s’il est visible.)";
      return;
    }

    /* ==================================================
       5) HYDROGÈNE EXPLICITEMENT RELIÉ
       ================================================== */

    var indexH = symboles.indexOf("H");
    var indexN = symboles.indexOf("N");

    if (adj[indexH].length === 0) {
      feedback.innerHTML =
        "Un hydrogène doit être relié par une liaison pour être reconnu par la correction. " +
        "Revoyez la vidéo.";
      return;
    }

    /* ==================================================
       6) H RELIÉ AU BON ATOME (N, PAS Br)
       ================================================== */

    if (adj[indexH].length !== 1 || adj[indexH][0] !== indexN) {
      feedback.innerHTML =
        "L’hydrogène doit être relié à l’atome central.";
      return;
    }

    /* ==================================================
       SUCCÈS
       ================================================== */

    feedback.innerHTML =
      "Bravo ! La représentation de NHBr₂ est correctement reconnue par la correction.";
  });
}
