document.getElementById('pdfInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      
      reader.onload = function() {
        const typedArray = new Uint8Array(this.result);
        
        // Usar o pdf.js para carregar o PDF
        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
          let extractedText = '';
          
          // Processar cada página do PDF
          const pagePromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(
              pdf.getPage(i).then(page => {
                return page.getTextContent().then(textContent => {
                  textContent.items.forEach(item => {
                    extractedText += item.str + ' ';
                  });
                });
              })
            );
          }
          
          // Quando todas as páginas tiverem sido processadas, corrigir a redação
          Promise.all(pagePromises).then(() => {
            document.getElementById('redacao').value = extractedText;
            corrigirRedacao(); // Chama a função de correção
          });
        });
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      alert('Por favor, selecione um arquivo PDF válido.');
    }
  });
  
  async function corrigirRedacao() {
    const texto = document.getElementById('redacao').value;
  
    if (texto.trim() === '') {
      alert('Por favor, insira sua redação ou carregue um PDF.');
      return;
    }
  
    // Restante do código de correção (permanece igual)
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'text': texto,
          'language': 'pt-BR'
        })
      });
  
      if (!response.ok) {
        throw new Error('Erro ao acessar o serviço de correção.');
      }
  
      const data = await response.json();
      const erros = data.matches;
  
      // Inicializar contadores de erros por competência
      let competencia1 = 0; // Norma Culta
      let competencia2 = 0; // Compreensão da Proposta
      let competencia3 = 0; // Seleção e Organização
      let competencia4 = 0; // Mecanismos Linguísticos
      let competencia5 = 0; // Proposta de Intervenção
  
      // Pontos de melhoria detalhados por competência
      let melhoriasCompetencia1 = [];
      let melhoriasCompetencia2 = [];
      let melhoriasCompetencia3 = [];
      let melhoriasCompetencia4 = [];
      let melhoriasCompetencia5 = [];
  
      // Análise detalhada
      const palavras = texto.split(' ');
      const tamanhoTexto = palavras.length;
  
      erros.forEach(match => {
        const categoria = match.rule.category.id;
  
        // Competência 1: Norma Culta
        if (categoria === 'TYPOS' || categoria === 'GRAMMAR') {
          competencia1++;
          melhoriasCompetencia1.push(match.message);
        }
  
        // Competência 3: Seleção e Organização
        if (categoria === 'STYLE') {
          competencia3++;
          melhoriasCompetencia3.push(match.message);
        }
  
        // Competência 4: Mecanismos Linguísticos
        if (categoria === 'PUNCTUATION' || categoria === 'TYPOGRAPHY') {
          competencia4++;
          melhoriasCompetencia4.push(match.message);
        }
  
        // Competência 5: Proposta de Intervenção
        if (texto.toLowerCase().includes('solução') || texto.toLowerCase().includes('proposta')) {
          competencia5++;
          melhoriasCompetencia5.push('Proposta de intervenção identificada.');
        } else if (competencia5 === 0) {
          melhoriasCompetencia5.push('Nenhuma proposta de intervenção identificada.');
        }
      });
  
      // Análise de Competência 2: Compreensão da Proposta
      const temasRelacionados = ['tema', 'discurso', 'argumento']; // Adapte para temas reais
      const mencionaTema = temasRelacionados.some(tema => texto.toLowerCase().includes(tema));
      if (!mencionaTema) {
        competencia2++;
        melhoriasCompetencia2.push('O texto não aborda o tema proposto de forma clara.');
      }
  
      // Cálculo das notas por competência com base nos critérios do ENEM
      const notaCompetencia1 = Math.max(200 - (competencia1 / tamanhoTexto) * 200, 0).toFixed(2);
      const notaCompetencia2 = mencionaTema ? 200 : 0;
      const notaCompetencia3 = Math.max(200 - (competencia3 / tamanhoTexto) * 200, 0).toFixed(2);
      const notaCompetencia4 = Math.max(200 - (competencia4 / tamanhoTexto) * 200, 0).toFixed(2);
      const notaCompetencia5 = competencia5 > 0 ? 200 : 0;
  
      // Cálculo da nota final
      const notaFinal = (
        (parseFloat(notaCompetencia1) +
          parseFloat(notaCompetencia2) +
          parseFloat(notaCompetencia3) +
          parseFloat(notaCompetencia4) +
          parseFloat(notaCompetencia5)) / 5
      ).toFixed(2);
  
      // Exibir as notas na tela
      document.getElementById('notaCompetencia1').innerText = `Nota: ${notaCompetencia1}`;
      document.getElementById('notaCompetencia2').innerText = `Nota: ${notaCompetencia2}`;
      document.getElementById('notaCompetencia3').innerText = `Nota: ${notaCompetencia3}`;
      document.getElementById('notaCompetencia4').innerText = `Nota: ${notaCompetencia4}`;
      document.getElementById('notaCompetencia5').innerText = `Nota: ${notaCompetencia5}`;
      document.getElementById('notaFinal').innerText = `Nota Final: ${notaFinal}`;
  
      // Exibir feedback detalhado para cada competência
      const melhorias1 = document.getElementById('melhoriasCompetencia1');
      const melhorias2 = document.getElementById('melhoriasCompetencia2');
      const melhorias3 = document.getElementById('melhoriasCompetencia3');
      const melhorias4 = document.getElementById('melhoriasCompetencia4');
      const melhorias5 = document.getElementById('melhoriasCompetencia5');
  
      melhorias1.innerHTML = melhoriasCompetencia1.length > 0 ? melhoriasCompetencia1.map(m => `<li>${m}</li>`).join('') : '<li>Nenhum erro encontrado.</li>';
      melhorias2.innerHTML = melhoriasCompetencia2.length > 0 ? melhoriasCompetencia2.map(m => `<li>${m}</li>`).join('') : '<li>Nenhum erro encontrado.</li>';
      melhorias3.innerHTML = melhoriasCompetencia3.length > 0 ? melhoriasCompetencia3.map(m => `<li>${m}</li>`).join('') : '<li>Nenhum erro encontrado.</li>';
      melhorias4.innerHTML = melhoriasCompetencia4.length > 0 ? melhoriasCompetencia4.map(m => `<li>${m}</li>`).join('') : '<li>Nenhum erro encontrado.</li>';
      melhorias5.innerHTML = melhoriasCompetencia5.length > 0 ? melhoriasCompetencia5.map(m => `<li>${m}</li>`).join('') : '<li>Nenhum erro encontrado.</li>';
  
      // Sugestões de melhoria detalhadas para cada competência
      const sugestoesCompetencia1 = `
          <p><strong>Competência 1 (Norma Culta):</strong></p>
          <ul>
              <li>Revise a ortografia e gramática com cuidado para evitar erros de digitação e concordância.</li>
              <li>Utilize conectivos para garantir fluidez entre as ideias.</li>
              <li>Evite construções informais, como gírias e linguagem coloquial.</li>
          </ul>`;
  
      const sugestoesCompetencia2 = `
          <p><strong>Competência 2 (Compreensão da Proposta):</strong></p>
          <ul>
              <li>Certifique-se de que seu texto está abordando o tema proposto de forma clara e direta.</li>
              <li>Desenvolva sua tese de forma consistente, argumentando com base em fatos e dados.</li>
              <li>Releia o enunciado do tema para garantir que está atendendo todos os seus aspectos.</li>
          </ul>`;
  
      const sugestoesCompetencia3 = `
          <p><strong>Competência 3 (Seleção e Organização):</strong></p>
          <ul>
              <li>Organize suas ideias de forma lógica, garantindo coesão e coerência entre os parágrafos.</li>
              <li>Faça uma introdução clara e objetiva, seguida de argumentos bem estruturados.</li>
              <li>Finalize com uma conclusão que resuma as principais ideias apresentadas.</li>
          </ul>`;
  
      const sugestoesCompetencia4 = `
          <p><strong>Competência 4 (Mecanismos Linguísticos):</strong></p>
          <ul>
              <li>Preste atenção à pontuação, pois ela influencia diretamente na clareza das ideias.</li>
              <li>Use frases curtas e objetivas para evitar confusões e ambiguidades.</li>
              <li>Varie o vocabulário para enriquecer seu texto e evitar repetições.</li>
          </ul>`;
  
      const sugestoesCompetencia5 = `
          <p><strong>Competência 5 (Proposta de Intervenção):</strong></p>
          <ul>
              <li>Elabore uma proposta de intervenção detalhada, considerando os agentes responsáveis pela ação.</li>
              <li>Certifique-se de que a proposta é viável, clara e respeita os direitos humanos.</li>
              <li>Desenvolva soluções que realmente respondam ao problema apresentado no texto.</li>
          </ul>`;
  
      document.getElementById('sugestoesCompetencia1').innerHTML = sugestoesCompetencia1;
      document.getElementById('sugestoesCompetencia2').innerHTML = sugestoesCompetencia2;
      document.getElementById('sugestoesCompetencia3').innerHTML = sugestoesCompetencia3;
      document.getElementById('sugestoesCompetencia4').innerHTML = sugestoesCompetencia4;
      document.getElementById('sugestoesCompetencia5').innerHTML = sugestoesCompetencia5;
  
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao corrigir a redação. Por favor, tente novamente.');
    }
  }
  