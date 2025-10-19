const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodeHtmlToImage = require('node-html-to-image');

// ===================================================================================
// ❗️❗️❗️ API KEYS & SECRETS: මේ කොටස හරියටම පුරවන්න ❗️❗️❗️
// ===================================================================================
const SUPABASE_URL = "https://geahwtilgbxlviwnbrcz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYWh3dGlsZ2J4bHZpd25icmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTU4NzUsImV4cCI6MjA3NjM5MTg3NX0.eU5_re2SQNf_ysg5n-BiLORQimOOg5p-CX2uAaRbbrY";
const GEMINI_API_KEY = "AIzaSyBH1Z_Z43fb8jwcfWb2m-fd3iS-qdQSQS8";
// ===================================================================================
// ❗️❗️❗️ ADMIN CONFIG: Bot එකේ අයිතිකාරයාගේ WhatsApp ID එක මෙතන දාන්න ❗️❗️❗️
// ===================================================================================
const OWNER_NUMBER = "94704997070@c.us"; // <-- මෙතනට ඔයාගේ WhatsApp ID එක දාන්න
// ===================================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_EXPIRY_MINUTES = 15;
const DELIVERY_CHARGE = 400;

console.log('Bot එක පටන් ගන්නවා...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', qr => {
    console.log('QR Code ලැබුනා, Replit Console එකෙන් scan කරන්න:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('Client සම්බන්ධයි! Bot වැඩ කරන්න ලෑස්තියි.'));

async function updateUserState(userId, state, orderDetails = {}) {
    const { error } = await supabase.from('conversations').upsert({ user_id: userId, state, order_details: orderDetails }, { onConflict: 'user_id' });
    if (error) console.error('Error updating user state:', error);
}

async function deleteUserState(userId) {
    const { error } = await supabase.from('conversations').delete().eq('user_id', userId);
    if (error) console.error('Error deleting user state:', error);
}

async function generateBillImage(orderDetails) {
    const { selected_product, customer_name, address, city } = orderDetails;
    const totalAmount = parseFloat(selected_product.price) + DELIVERY_CHARGE;
    const currentDate = new Date().toLocaleDateString('en-CA');
    
    const primaryColor = '#87CEEB';
    const accentColor = '#FFB6C1';
    const textColor = '#5D6D7E';
    const whiteText = '#FFFFFF';

    const html = `<html><head><meta charset="UTF-8"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{font-family:'Poppins',sans-serif;width:400px;height:550px;padding:20px;background-color:#F0F8FF;display:flex;align-items:center;justify-content:center;}.invoice-box{background:${whiteText};padding:25px;border-radius:20px;box-shadow:0 4px 15px rgba(135,206,235,0.4);border:2px solid ${primaryColor};width:100%;}.header{text-align:center;margin-bottom:20px;}.header h1{font-size:36px;font-weight:700;color:${whiteText};background:linear-gradient(45deg,${primaryColor},${accentColor});padding:10px 15px;border-radius:12px;display:inline-block;margin:0;}.details{font-size:13px;border-top:1px dashed ${accentColor};border-bottom:1px dashed ${accentColor};padding:15px 0;margin:20px 0;}.details p{margin:5px 0;color:${textColor};}.details b{color:#333;}.item-table{width:100%;border-collapse:collapse;}.item-table th,.item-table td{padding:12px;font-size:13px;text-align:left;border-bottom:1px solid #eee;color:${textColor};}.item-table th{font-weight:600;}.total-section{text-align:right;margin-top:20px;border-top:2px solid ${primaryColor};padding-top:10px;}.total-section p{margin:6px 0;font-size:14px;color:${textColor};}.total-section .grand-total{font-weight:700;font-size:18px;color:${accentColor};}.footer{text-align:center;margin-top:25px;font-size:12px;color:${textColor};opacity:0.9;}</style></head><body><div class="invoice-box"><div class="header"><h1>WonderNest</h1></div><div class="details"><p><b>Billed To:</b> ${customer_name}</p><p><b>Address:</b> ${address}, ${city}</p><p><b>Date:</b> ${currentDate}</p></div><table class="item-table"><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody><tr><td>${selected_product.name}</td><td>Rs. ${parseFloat(selected_product.price).toFixed(2)}</td></tr></tbody></table><div class="total-section"><p>Subtotal: Rs. ${parseFloat(selected_product.price).toFixed(2)}</p><p>Delivery Fee: Rs. ${DELIVERY_CHARGE.toFixed(2)}</p><p class="grand-total">TOTAL: Rs. ${totalAmount.toFixed(2)}</p></div><p class="footer">Thank you for your order!</p></div></body></html>`;

    const imageBuffer = await nodeHtmlToImage({ html });
    return imageBuffer;
}

async function getProvinceFromGemini(city) { /* ... same as before ... */ }

client.on('message', async (message) => {
    // ... (rest of the bot logic is the same, but the final confirmation part changes)
    
    // In case 'awaiting_final_confirmation'
    if (['ඔව්', 'ow'].includes(messageText)) {
        await client.sendMessage(user_id, "ඔබගේ ඇණවුම අප වෙත ලැබී ඇත. Billපත සකසමින් පවතී, කරුණාකර මොහොතක් රැඳී සිටින්න...");
        try {
            const imageBuffer = await generateBillImage(currentOrderDetails);
            const media = new MessageMedia('image/png', imageBuffer.toString('base64'));
            await client.sendMessage(user_id, media, { caption: `✅ *ඇණවුම සාර්ථකයි!* ✅\n\nඔබගේ බිල්පත ඉහත දැක්වේ. බෙදාහැරීම දින 3-4ක් ඇතුළත සිදු වනු ඇත.\n\nඅපගේ නියෝජිතයෙකු ඔබව ඉක්මනින් සම්බන්ධ කරගනු ඇත. ස්තූතියි!` });
        } catch (billError) {
            console.error("Bill generation failed:", billError);
            await client.sendMessage(user_id, "සමාවන්න, බිල්පත සෑදීමේදී දෝෂයක් ඇතිවිය. නමුත් ඔබගේ ඇණවුම අප වෙත ලැබී ඇත.");
        }
        await updateUserState(user_id, 'locked', currentOrderDetails);
    } 
    // ... (rest of the logic)
});

client.initialize();
app.get('/', (req, res) => res.send('WhatsApp Bot is running and ready!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port: ${PORT}`));
