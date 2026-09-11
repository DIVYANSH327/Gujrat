const fs = require('fs');
let content = fs.readFileSync('src/components/AlertCard.tsx', 'utf-8');

if (!content.includes('sourceType?: string;')) {
    content = content.replace(
        "cameraId: string;",
        "cameraId: string;\n  sourceType?: string;"
    );
}

content = content.replace(
    "<span className=\"text-[11px] font-semibold text-slate-500 uppercase\">Camera</span>",
    "<span className=\"text-[11px] font-semibold text-slate-500 uppercase\">{alert.sourceType ? alert.sourceType.replace(/_/g, ' ') : 'Camera'}</span>"
);

fs.writeFileSync('src/components/AlertCard.tsx', content);
console.log('Patched AlertCard.tsx');
