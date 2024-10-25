// Importações necessárias
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Função para gerar feedback detalhado
function gerarFeedbackCompleto(nota) {
  const feedback = {
    competencia1: '',
    competencia2: '',
    competencia3: '',
    competencia4: '',
    competencia5: ''
  };

  // Competência 1: Domínio da norma culta
  if (nota >= 900) {
    feedback.competencia1 = 'Excelente domínio da norma culta, com raros ou nenhum erro gramatical. Uso adequado de concordância verbal e nominal, além de um vocabulário rico e diversificado.';
  } else if (nota >= 700) {
    feedback.competencia1 = 'Bom domínio da norma culta, com poucos erros gramaticais. Alguns ajustes em concordância verbal e nominal são necessários.';
  } else {
    feedback.competencia1 = 'É necessário melhorar o domínio da norma culta, corrigindo erros frequentes de gramática e concordância. Revisar o uso de pontuação e ortografia.';
  }

  // Competência 2: Compreensão da proposta e organização das ideias
  if (nota >= 900) {
    feedback.competencia2 = 'A redação demonstra excelente compreensão da proposta com uma argumentação clara e bem estruturada. Os parágrafos são coesos e fluem logicamente.';
  } else if (nota >= 700) {
    feedback.competencia2 = 'Boa compreensão da proposta, mas há pequenas falhas na argumentação ou organização dos parágrafos. A transição entre as ideias pode ser mais fluida.';
  } else {
    feedback.competencia2 = 'É necessário melhorar a organização das ideias. As transições entre parágrafos não são claras, e a argumentação precisa ser mais desenvolvida.';
  }

  // Competência 3: Seleção de repertório sociocultural
  if (nota >= 900) {
    feedback.competencia3 = 'A redação apresenta um repertório sociocultural diversificado e relevante, com exemplos bem conectados à tese central.';
  } else if (nota >= 700) {
    feedback.competencia3 = 'O repertório sociocultural está presente, mas pode ser aprofundado ou melhor conectado aos argumentos.';
  } else {
    feedback.competencia3 = 'A redação apresenta poucas referências externas. A inclusão de repertório sociocultural relevante e bem articulado ajudará a fortalecer os argumentos.';
  }

  // Competência 4: Coesão textual
  if (nota >= 900) {
    feedback.competencia4 = 'Excelente coesão textual, com conectivos utilizados de forma eficaz para ligar as ideias.';
  } else if (nota >= 700) {
    feedback.competencia4 = 'Boa coesão, mas alguns conectivos poderiam ser melhor utilizados para garantir uma transição mais suave entre as ideias.';
  } else {
    feedback.competencia4 = 'A redação apresenta falhas de coesão, dificultando o fluxo das ideias. Revisar o uso de conectivos.';
  }

  // Competência 5: Proposta de intervenção
  if (nota >= 900) {
    feedback.competencia5 = 'A proposta de intervenção é completa, detalhada e viável, considerando todos os aspectos do problema.';
  } else if (nota >= 700) {
    feedback.competencia5 = 'A proposta de intervenção é boa, mas poderia ser mais detalhada ou incluir mais elementos práticos.';
  } else {
    feedback.competencia5 = 'A proposta de intervenção é vaga ou inexistente. É importante propor uma solução prática e detalhada para o problema abordado.';
  }

  return feedback;
}

// Função para gerar o PDF
function gerarPDF(correcao, nomeArquivo) {
  const doc = new PDFDocument();
  const caminhoPDF = path.join(__dirname, 'public', nomeArquivo);
  doc.pipe(fs.createWriteStream(caminhoPDF));

  // Título do PDF
  doc.fontSize(25).text('Correção da Redação', { align: 'center' });
  doc.moveDown();

  // Texto da Redação
  doc.fontSize(16).text(`Texto da Redação:\n${correcao.redacao}\n`);
  doc.moveDown();

  // Competências e Sugestões detalhadas
  for (let i = 1; i <= 5; i++) {
    doc.fontSize(16).text(`Competência ${i}:`);
    doc.fontSize(12).text(`Análise: ${correcao[`competencia${i}`]}\n`);
    doc.moveDown();
  }

  // Nota final
  doc.fontSize(20).text(`Nota Final: ${correcao.notaFinal} / 1000`, { align: 'center' });

  doc.end();
  return caminhoPDF;
}

// Endpoint para correção de redação
app.post('/corrigir-redacao', async (req, res) => {
  const { textoRedacao, nota } = req.body;

  try {
    // Gerar feedback completo
    const feedback = gerarFeedbackCompleto(nota);
    
    const correcao = {
      redacao: textoRedacao,
      competencia1: feedback.competencia1,
      competencia2: feedback.competencia2,
      competencia3: feedback.competencia3,
      competencia4: feedback.competencia4,
      competencia5: feedback.competencia5,
      notaFinal: nota
    };

    // Gerar PDF com as informações
    const caminhoPDF = gerarPDF(correcao, 'redacao-corrigida.pdf');

    // Retornar o PDF gerado para o cliente
    res.download(caminhoPDF);
  } catch (error) {
    console.error('Erro ao corrigir a redação:', error);
    res.status(500).send('Erro ao corrigir a redação.');
  }
});

// Servidor rodando
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
