#!/bin/bash
sed -i 's/setQuantity(prev => Math.max(1, prev + amount));/setQuantity(prev => { const num = Number(prev) || 0; return Math.max(1, Number((num + amount).toFixed(2))); });/g' src/components/MobileApp.tsx
sed -i 's/setRealCountQty(prev => Math.max(0, prev + amount));/setRealCountQty(prev => { const num = Number(prev) || 0; return Math.max(0, Number((num + amount).toFixed(2))); });/g' src/components/MobileApp.tsx
