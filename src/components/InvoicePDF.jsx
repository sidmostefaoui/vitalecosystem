import jsPDF from 'jspdf';

export const generateInvoicePDF = (facture, client, isPeriodic = false) => {
  const doc = new jsPDF();
  
  // Ajout d'un fond gris clair en en-tête
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, 210, 40, "F");

  // Logo (à remplacer par votre logo)
  // doc.addImage(logoData, 'PNG', 20, 10, 40, 20);
  
  // En-tête avec style moderne
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.text("FACTURE", 105, 25, { align: "center" });

  // Informations de l'entreprise avec style
  doc.setFontSize(12);
  doc.setTextColor(52, 73, 94);
  doc.text("VOTRE ENTREPRISE", 20, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text([
    "123 Rue de l'Entreprise",
    "75000 Paris",
    "Tél : 01 23 45 67 89",
    "Email : contact@entreprise.com",
    "SIRET : 123 456 789 00000"
  ], 20, 60);

  // Cadre pour les informations client
  doc.setDrawColor(52, 73, 94);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(110, 45, 80, 40, 3, 3, 'FD');
  
  doc.setFont("helvetica", "bold");
  doc.text("FACTURER À", 115, 55);
  doc.setFont("helvetica", "normal");
  doc.text([
    `${client.entreprise}`,
    `${client.prenom} ${client.nom}`,
    `CRNC : ${client.crnc}`
  ], 115, 65);

  // Informations de la facture
  doc.setFillColor(52, 73, 94);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, 90, 170, 10, "F");
  doc.text(`Facture N° : ${facture.numero}`, 25, 97);
  doc.text(`Date : ${facture.date}`, 100, 97);
  doc.text(`Type : ${facture.type}`, 150, 97);

  // Tableau des prestations
  const startY = 110;
  doc.setTextColor(52, 73, 94);
  
  // En-têtes du tableau
  doc.setFillColor(236, 240, 241);
  doc.rect(20, startY, 170, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, startY + 7);
  doc.text("Montant HT", 150, startY + 7);

  // Contenu
  doc.setFont("helvetica", "normal");
  
  if (isPeriodic && facture.details) {
    let y = startY + 20;
    facture.details.forEach((detail, index) => {
      doc.text(`${detail.date} - ${detail.description}`, 25, y);
      doc.text(`${detail.montant.toFixed(2)}`, 150, y);
      y += 10;
    });
  } else {
    doc.text(facture.description, 25, startY + 20);
    doc.text(`${facture.montant.toFixed(2)}`, 150, startY + 20);
  }

  // Calculs avec style
  const montantHT = facture.montant;
  const tva = montantHT * 0.20;
  const total = montantHT + tva;

  // Cadre pour les totaux
  const totalsY = startY + (isPeriodic ? facture.details.length * 10 + 30 : 50);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(110, totalsY, 80, 40, 3, 3, 'FD');
  
  doc.text("Montant HT", 115, totalsY + 10);
  doc.text(`${montantHT.toFixed(2)}`, 180, totalsY + 10, { align: "right" });
  
  doc.text("TVA 20%", 115, totalsY + 20);
  doc.text(`${tva.toFixed(2)}`, 180, totalsY + 20, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.setFillColor(52, 73, 94);
  doc.setTextColor(255, 255, 255);
  doc.roundedRect(110, totalsY + 25, 80, 10, 3, 3, 'F');
  doc.text("Total TTC", 115, totalsY + 32);
  doc.text(`${total.toFixed(2)}`, 180, totalsY + 32, { align: "right" });

  // Conditions de paiement avec style
  doc.setFont("helvetica", "normal");
  doc.setTextColor(52, 73, 94);
  doc.setFontSize(9);
  const conditionsY = totalsY + 50;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, conditionsY, 170, 30, 3, 3, 'F');
  doc.text([
    "Conditions de paiement :",
    "• Paiement à 30 jours",
    "• En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée",
    "• Pas d'escompte en cas de paiement anticipé"
  ], 25, conditionsY + 10);

  // Pied de page
  doc.setFontSize(8);
  doc.text("VOTRE ENTREPRISE - SIRET 123 456 789 00000 - TVA FR12345678900", 105, 280, { align: "center" });

  return doc;
}; 