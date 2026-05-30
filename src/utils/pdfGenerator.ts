import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getGstBreakdown } from "./gst";

// Helper to convert number to words (Indian Rupee system)
function numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim();
}

export const generateInvoicePDF = (details: any) => {
    const doc = new jsPDF();
    const kyc = details.dealerKyc || {};
    
    // Document layout constants
    const marginX = 14;
    const marginY = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (marginX * 2);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Order Summary", pageWidth / 2, marginY, { align: "center" });

    // Main Outer Border (will be drawn after we know total height, but we can draw piece by piece)
    const boxStartY = marginY + 5;
    let currentY = boxStartY;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Top Header Section (Company & Order Details)
    const headerHeight = 45;
    doc.rect(marginX, currentY, contentWidth, headerHeight); // Header Box
    
    // Vertical line splitting header
    const midX = pageWidth / 2 + 10;
    doc.line(midX, currentY, midX, currentY + headerHeight);

    // --- Left Side (Company Details) ---
    // Mock Logo Block
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(marginX + 2, currentY + 2, 35, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Sujala", marginX + 4, currentY + 10);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("SUJALA AGRO PLAST", marginX + 40, currentY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Survey No 235, Village Akrale Tal Dindori,", marginX + 40, currentY + 13);
    doc.text("Dist Nashik Maharashtra - 422003, India,", marginX + 40, currentY + 17);
    doc.text("Nashik, MAHARASHTRA, 422004.", marginX + 40, currentY + 21);
    
    doc.text("GSTIN/UIN : 27XXXXX0000X1Z5", marginX + 40, currentY + 27);
    doc.text("State Name : Maharashtra", marginX + 40, currentY + 31);
    doc.text("Contact : 93569 68162", marginX + 40, currentY + 35);
    doc.text("Email : info@sujalaagroplast.com", marginX + 40, currentY + 39);

    // --- Right Side (Order Details Grid) ---
    const rowH = 7.5;
    // Row 1
    doc.line(midX, currentY + rowH, pageWidth - marginX, currentY + rowH);
    doc.setFont("helvetica", "bold");
    doc.text("Order No.", midX + 2, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`SO/${details.id.slice(0, 8).toUpperCase()}`, midX + 35, currentY + 5);
    doc.line(midX + 33, currentY, midX + 33, currentY + (rowH * 6)); // Vertical divider inside right block

    // Row 2
    doc.line(midX, currentY + (rowH * 2), pageWidth - marginX, currentY + (rowH * 2));
    doc.setFont("helvetica", "bold");
    doc.text("Dated", midX + 2, currentY + rowH + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date(details.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, midX + 35, currentY + rowH + 5);

    // Row 3
    doc.line(midX, currentY + (rowH * 3), pageWidth - marginX, currentY + (rowH * 3));
    doc.setFont("helvetica", "bold");
    doc.text("Mode/Terms", midX + 2, currentY + (rowH * 2) + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`${details.paymentTerms || 'N/A'}`, midX + 35, currentY + (rowH * 2) + 5);

    // Row 4
    doc.line(midX, currentY + (rowH * 4), pageWidth - marginX, currentY + (rowH * 4));
    doc.setFont("helvetica", "bold");
    doc.text("Dispatched through", midX + 2, currentY + (rowH * 3) + 5);

    // Row 5
    doc.line(midX, currentY + (rowH * 5), pageWidth - marginX, currentY + (rowH * 5));
    doc.setFont("helvetica", "bold");
    doc.text("LR NO/ Vehicle", midX + 2, currentY + (rowH * 4) + 5);

    // Row 6
    doc.setFont("helvetica", "bold");
    doc.text("Name & Contact", midX + 2, currentY + (rowH * 5) + 5);

    currentY += headerHeight;

    // --- Buyer (Bill To) Section ---
    const buyerHeight = 35;
    doc.rect(marginX, currentY, contentWidth, buyerHeight);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Buyer (Bill To)", marginX + 2, currentY + 5);
    
    doc.setFontSize(10);
    doc.text(kyc.firmName || "DEALER FIRM NOT SET", marginX + 2, currentY + 11);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(kyc.address || "Address not provided", marginX + 2, currentY + 15);
    
    doc.text(`GSTIN/UIN : ${kyc.gstin || 'N/A'}`, marginX + 2, currentY + 21);
    doc.text(`PAN : ${kyc.pan || 'N/A'}`, marginX + 2, currentY + 25);
    doc.text(`Contact Person : ${kyc.proprietorName || 'N/A'}`, marginX + 2, currentY + 29);
    doc.text(`Mobile : ${kyc.mobile || 'N/A'}`, marginX + 2, currentY + 33);

    currentY += buyerHeight;

    // --- Items Table ---
    let totalBaseAmount = 0;
    
    const tableData = details.items.map((item: any, idx: number) => {
        const gst = getGstBreakdown(item.unitPrice, item.category, item.quantity, item.gstRate);
        const rateNet = gst.basePrice / item.quantity;
        const rateIncTax = item.unitPrice;
        totalBaseAmount += gst.basePrice;

        return [
            (idx + 1).toString(),
            `${item.productName} ${item.variantName} ${item.width}/${item.length}`,
            `${gst.gstRate}%`,
            item.quantity.toString(),
            rateIncTax.toFixed(2),
            rateNet.toFixed(2),
            item.type || 'Roll',
            gst.basePrice.toFixed(2)
        ];
    });

    autoTable(doc, {
        startY: currentY,
        margin: { left: marginX, right: marginX },
        theme: 'grid',
        head: [['SR No.', 'Name of Item', 'GST Rate', 'Quantity', 'Rate(Inc Of Tax)', 'Rate(Net)', 'Unit', 'Amount']],
        body: tableData,
        styles: { fontSize: 8, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.3 },
        headStyles: { fillColor: [255,255,255], textColor: [0,0,0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 22 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'center', cellWidth: 12 },
            7: { halign: 'right', cellWidth: 25 },
        },
        willDrawCell: function () {
            // Keep specific cells bold based on design
        },
    });

    currentY = (doc as any).lastAutoTable.finalY;

    // --- Summary Calculations ---
    const taxableAmount = totalBaseAmount;
    let runningTotal = taxableAmount;
    
    // Draw summary rows inside a custom table to match exact grid structure
    const appliedDiscounts = details.appliedDiscounts || [];
    const cgstAmt = (details.taxAmount || 0) / 2;
    const sgstAmt = (details.taxAmount || 0) / 2;
    const grandTotal = details.totalAmount || (taxableAmount + details.taxAmount);
    const roundedGrandTotal = Math.round(grandTotal);
    const roundOff = roundedGrandTotal - grandTotal;

    const summaryRows: any[] = [];
    summaryRows.push([{ content: 'Taxable Amount', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, { content: taxableAmount.toFixed(2), styles: { halign: 'right' } }]);

    appliedDiscounts.forEach((disc: any) => {
        summaryRows.push([
            { content: `Less: ${disc.name} (-) ${disc.percentage}%`, colSpan: 7, styles: { halign: 'right', fontStyle: 'italic' } },
            { content: (disc.amount || 0).toFixed(2), styles: { halign: 'right' } }
        ]);
        runningTotal -= (disc.amount || 0);
    });

    summaryRows.push([{ content: `CGST`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, { content: cgstAmt.toFixed(2), styles: { halign: 'right' } }]);
    summaryRows.push([{ content: `SGST`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, { content: sgstAmt.toFixed(2), styles: { halign: 'right' } }]);
    
    if (Math.abs(roundOff) > 0.005) {
        summaryRows.push([{ content: `Round Off`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, { content: roundOff.toFixed(2), styles: { halign: 'right' } }]);
    }

    // Final Total Row
    const totalQty = details.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
    
    // We render this manually to make the quantity align under quantity col
    autoTable(doc, {
        startY: currentY,
        margin: { left: marginX, right: marginX },
        theme: 'grid',
        body: summaryRows,
        styles: { fontSize: 8, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.3 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { halign: 'right', cellWidth: 25 } }, // It auto balances remaining
    });
    
    currentY = (doc as any).lastAutoTable.finalY;

    // Custom Total Row (to put Total under item name, Qty under Qty)
    const totalRowH = 7;
    doc.rect(marginX, currentY, contentWidth, totalRowH);
    doc.setFont("helvetica", "bold");
    doc.text("Total", marginX + 80, currentY + 5);
    // Rough estimate of Quantity column X based on autoTable widths
    // A better approach is matching the columns, but for now we place it roughly
    doc.text(totalQty.toString(), pageWidth - marginX - 90, currentY + 5, { align: 'center' });
    doc.text(`${roundedGrandTotal.toFixed(2)}`, pageWidth - marginX - 2, currentY + 5, { align: 'right' });
    
    // Lines inside total row
    doc.line(pageWidth - marginX - 25, currentY, pageWidth - marginX - 25, currentY + totalRowH);
    doc.line(pageWidth - marginX - 100, currentY, pageWidth - marginX - 100, currentY + totalRowH);
    doc.line(pageWidth - marginX - 75, currentY, pageWidth - marginX - 75, currentY + totalRowH);

    currentY += totalRowH;

    // --- Amount in words ---
    const wordsH = 15;
    doc.rect(marginX, currentY, contentWidth, wordsH);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Amount Chargeable (in words)", marginX + 2, currentY + 4);
    doc.setFont("helvetica", "normal");
    const amountStr = numberToWords(Math.floor(roundedGrandTotal));
    doc.text(`INR ${amountStr} Rupees Only`, marginX + 2, currentY + 12);
    
    currentY += wordsH;

    // --- Bottom Section ---
    const bottomH = 30;
    doc.rect(marginX, currentY, contentWidth, bottomH);
    doc.line(midX, currentY, midX, currentY + bottomH);

    doc.setFont("helvetica", "bold");
    doc.text("Company's PAN :", marginX + 2, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(kyc.pan || "N/A", marginX + 30, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Company's Bank Details", midX + 2, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`A/c Holder's Name : ${kyc.firmName || "N/A"}`, midX + 2, currentY + 12);
    doc.text(`Bank Name : ${kyc.bankName || "N/A"}`, midX + 2, currentY + 16);
    doc.text(`A/c No. : ${kyc.bankAccountNo || "N/A"}`, midX + 2, currentY + 20);
    doc.text(`Branch & IFSC : ${kyc.bankIfsc || "N/A"}`, midX + 2, currentY + 24);

    currentY += bottomH;

    // --- Signature Section ---
    const sigH = 25;
    doc.rect(marginX, currentY, contentWidth, sigH);
    doc.line(midX, currentY, midX, currentY + sigH);

    doc.setFontSize(8);
    doc.text("Customer's Seal and Signature", marginX + 2, currentY + 5);
    
    doc.text("for SUJALA AGRO PLAST", pageWidth - marginX - 2, currentY + 5, { align: "right" });
    doc.text("Authorised Signatory", pageWidth - marginX - 2, currentY + 22, { align: "right" });

    currentY += sigH;

    doc.setFontSize(10);
    doc.text("SUBJECT TO NASHIK JURISDICTION", pageWidth / 2, currentY + 10, { align: "center" });
    doc.text("This is a Computer Generated Invoice", pageWidth / 2, currentY + 16, { align: "center" });

    doc.save(`Invoice_ORD_${details.id.slice(0, 8).toUpperCase()}.pdf`);
};
