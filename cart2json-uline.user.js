// ==UserScript==
// @name         Uline Cart to JSON Extractor
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Extracts Uline shopping cart items to a JSON array of objects (Product Name, Link, Cost, Qty).
// @author       You
// @match        *://*.uline.com/*Cart*
// @match        *://*.uline.com/*cart*
// @match        *://*.uline.ca/*Cart*
// @match        *://*.uline.mx/*Cart*
// @grant        GM_setClipboard
// @updateURL    https://github.com/TechplexEngineer/userscript-uline-cart-export/raw/refs/heads/main/cart2json-uline.user.js
// @downloadURL  https://github.com/TechplexEngineer/userscript-uline-cart-export/raw/refs/heads/main/cart2json-uline.user.js
// ==/UserScript==

(function() {
    'use strict';

    function extractCart() {
        const items = [];
        
        // Target Uline's specific product row classes
        const rows = document.querySelectorAll('tr.ViewCartGridItem, tr.ViewCartGridAlternatingItem');

        rows.forEach(row => {
            // Find a quantity input
            const allInputs = row.querySelectorAll('input[type="text"], input[type="number"]');
            let qty = "";
            for (let input of allInputs) {
                if (!isNaN(input.value) && input.value.trim() !== "") {
                    qty = input.value.trim();
                    break;
                }
            }

            const links = row.querySelectorAll('a');
            if (links.length === 0 || !qty) return;

            // Uline usually has two links per product row: Model # and Description. 
            let titleElement = Array.from(links).reduce((longest, current) => {
                return current.innerText.trim().length > longest.innerText.trim().length ? current : longest;
            }, { innerText: "" });

            const product_name = titleElement.innerText.trim();
            const link = titleElement.href ? titleElement.href.split('?')[0] : ''; 

            // Extract price and strip out the $ and /EA, /RL, etc.
            let cost = "";
            const cells = row.querySelectorAll('td');
            for (let cell of cells) {
                const text = cell.innerText.trim();
                // Regex uses a capture group () to grab only the digits, commas, and decimals
                const priceMatch = text.match(/\$([\d,]+\.\d{2})/);
                if (priceMatch) {
                    cost = priceMatch[1]; // Grab just the captured number group
                    break; 
                }
            }

            // Only add items that successfully parsed a product name and cost
            if (product_name && cost) {
                items.push({
                    product_name,
                    link,
                    cost,
                    qty
                });
            }
        });

        const jsonOutput = JSON.stringify(items, null, 2);
        console.log("Extracted Cart JSON:", jsonOutput);

        // Copy to clipboard using Tampermonkey's API
        if (typeof GM_setClipboard !== "undefined") {
            GM_setClipboard(jsonOutput);
            alert(`Successfully extracted ${items.length} items to your clipboard!`);
        } else {
            alert(`Successfully extracted ${items.length} items! Please check your browser's Developer Console.`);
        }
    }

    // Create and style the floating extraction button
    const btn = document.createElement('button');
    btn.innerText = "Extract Cart to JSON";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "999999";
    btn.style.padding = "12px 18px";
    btn.style.backgroundColor = "#0033A0"; // Uline Navy Blue
    btn.style.color = "#FFFFFF";
    btn.style.border = "1px solid #002266";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "14px";
    btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";

    // Hover effects
    btn.onmouseover = () => btn.style.backgroundColor = "#002266";
    btn.onmouseout = () => btn.style.backgroundColor = "#0033A0";

    btn.onclick = (e) => {
        e.preventDefault();
        extractCart();
    };

    document.body.appendChild(btn);
})();
