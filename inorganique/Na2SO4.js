function verifierNa2SO4() {

  const feedback = document.getElementById("feedback");
  const illustration = document.getElementById("illustration"); // ✅ AJOUT
  feedback.innerHTML = "";
  illustration.style.display = "none"; // ✅ AJOUT

  /* ========= 1) Questions de raisonnement ========= */

  if (document.getElementById("valenceElectrons").value != 32) {
    feedback.innerHTML =
      "Le nombre total d’électrons de valence de l’ion polyatomique SO₄²⁻ n’est pas correct.";
    return;
  }

  if (document.getElementById("doubletsCentraux").value != 0) {
    feedback.innerHTML =
      "Le nombre de doublets libres sur l’atome central de l’ion polyatomique SO₄²⁻ n’est pas correct.";
    return;
  }

  /* ========= 2) Lecture Ketcher ========= */

  const ketcher =
    document.getElementById("ketcherFrame").contentWindow.ketcher;

  ketcher.getMolfile().then(mol => {

    const lignes = mol.split("\n");
    const counts = lignes[3].trim().split(/\s+/);

    const nbAtomes = parseInt(counts[0], 10);
    const nbLiaisons = parseInt(counts[1], 10);

    const symboles = [];
    for (let i = 0; i < nbAtomes; i++) {
      symboles.push(lignes[4 + i].trim().split(/\s+/)[3]);
    }

    /* ========= 3) Composition ========= */

    let nbNa = 0, nbS = 0, nbO = 0;

    symboles.forEach(s => {
      if (s === "Na") nbNa++;
      else if (s === "S") nbS++;
      else if (s === "O") nbO++;
    });

    if (nbNa !== 2 || nbS !== 1 || nbO !== 4) {
      feedback.innerHTML =
        "La composition atomique ne correspond pas à la formule Na₂SO₄.";
      return;
    }

    /* ========= 4) Adjacence + Na ========= */

    const adj = Array.from({ length: nbAtomes }, () => []);

    for (let i = 0; i < nbLiaisons; i++) {
      const b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      const a1 = parseInt(b[0], 10) - 1;
      const a2 = parseInt(b[1], 10) - 1;

      adj[a1].push(a2);
      adj[a2].push(a1);

      if (symboles[a1] === "Na" || symboles[a2] === "Na") {
        feedback.innerHTML =
          "Dans un composé ionique, le sodium forme des ions Na⁺ et ne forme pas de liaisons covalentes.";
        return;
      }
    }

    /* ========= 5) Fragments ========= */

    const visite = new Array(nbAtomes).fill(false);
    let composantes = 0;

    function dfs(i) {
      visite[i] = true;
      adj[i].forEach(j => { if (!visite[j]) dfs(j); });
    }

    for (let i = 0; i < nbAtomes; i++) {
      if (!visite[i]) {
        dfs(i);
        composantes++;
      }
    }

    if (composantes !== 3) {
      feedback.innerHTML =
        "Rappelez‑vous : Na₂SO₄ est séparé en trois entités ioniques (deux Na⁺ et un SO₄²⁻).";
      return;
    }

    /* ========= 6) SQUELETTE — COMPACTITÉ ========= */

    const indexS = symboles.indexOf("S");
    const voisinsS = adj[indexS];

    if (voisinsS.length !== 4 ||
        !voisinsS.every(i => symboles[i] === "O")) {
      feedback.innerHTML =
        "La structure du SO₄²⁻ doit être compacte.";
      return;
    }

    /* ========= 7) Liaison O–O ========= */

    for (let i = 0; i < nbLiaisons; i++) {
      const b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      const a1 = parseInt(b[0], 10) - 1;
      const a2 = parseInt(b[1], 10) - 1;

      if (symboles[a1] === "O" && symboles[a2] === "O") {
        feedback.innerHTML =
          "La structure squelettique du SO₄²⁻ est erronée.";
        return;
      }
    }

    /* ========= 8) Charges ========= */

    const charges = {};
    lignes.forEach(l => {
      if (l.startsWith("M  CHG")) {
        const p = l.trim().split(/\s+/);
        let k = 3;
        for (let j = 0; j < parseInt(p[2]); j++) {
          charges[parseInt(p[k]) - 1] = parseInt(p[k + 1]);
          k += 2;
        }
      }
    });

    for (let i = 0; i < symboles.length; i++) {
      if (symboles[i] === "Na" && charges[i] !== 1) {
        feedback.innerHTML =
          "Quelle est la charge des ions Na dans la question précédente (séparation ionique) ?";
        return;
      }
      if (charges[i] > 0 && symboles[i] !== "Na") {
        feedback.innerHTML =
          "Charge formelle erronée dans le SO₄²⁻.";
        return;
      }
    }

    let chargeSO4 = 0;
    symboles.forEach((s, i) => {
      if (s === "S" || s === "O") chargeSO4 += charges[i] || 0;
    });

    if (chargeSO4 !== -2) {
      feedback.innerHTML =
        "Charge formelle erronée dans le SO₄²⁻.";
      return;
    }

    /* ========= 9) Plausibilité ========= */

    let simples = 0, doubles = 0, triples = 0;

    for (let i = 0; i < nbLiaisons; i++) {
      const b = lignes[4 + nbAtomes + i].trim().split(/\s+/);
      const a1 = parseInt(b[0], 10) - 1;
      const a2 = parseInt(b[1], 10) - 1;
      const ordre = parseInt(b[2], 10);

      if ((symboles[a1] === "S" && symboles[a2] === "O") ||
          (symboles[a2] === "S" && symboles[a1] === "O")) {
        if (ordre === 1) simples++;
        else if (ordre === 2) doubles++;
        else if (ordre === 3) triples++;
      }
    }

    if (triples > 0 || simples !== 2 || doubles !== 2) {
      feedback.innerHTML =
        "La structure du SO₄²⁻ n’est pas la plus plausible.";
      return;
    }

    /* ========= SUCCÈS ========= */

    feedback.innerHTML =
      "Bravo ! La représentation ionique de Na₂SO₄ semble correcte.";

    illustration.style.display = "block";
    illustration.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ AJOUT
  });
}