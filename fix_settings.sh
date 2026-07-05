#!/bin/bash
sed -i 's/{activeMenu === '\''integration'\'' && (/{activeMenu === '\''settings'\'' \&\& (/g' src/components/DesktopApp.tsx
sed -i 's/{activeMenu === '\''settings'\'' && (//g' src/components/DesktopApp.tsx
# Oops, the second sed will remove the first one too!
