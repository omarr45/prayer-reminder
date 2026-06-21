const vscode = require('vscode');

const adhkarStyle = `
  <style>
    body {
      font-family: 'Traditional Arabic', 'Scheherazade New', 'Amiri', 'Noto Naskh Arabic', serif;
      direction: rtl;
      text-align: right;
      line-height: 2.2;
      font-size: 20px;
      padding: 20px 30px;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
    }
    h1 {
      text-align: center;
      font-size: 28px;
      margin-bottom: 25px;
      color: var(--vscode-editorInfo-foreground, #3794ff);
    }
    .dhikr {
      background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1));
      border-radius: 8px;
      padding: 12px 18px;
      margin: 10px 0;
    }
    .dhikr .arabic {
      font-size: 22px;
    }
    .dhikr .count {
      font-size: 14px;
      color: var(--vscode-descriptionForeground, rgba(255,255,255,0.6));
      margin-top: 4px;
    }
    .reference {
      font-size: 13px;
      color: var(--vscode-descriptionForeground, rgba(255,255,255,0.5));
      margin-top: 2px;
    }
  </style>`;

const adhkarSabahHTML = `
  ${adhkarStyle}
  <h1>أذكار الصباح</h1>

  <div class="dhikr">
    <div class="arabic">أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ</div>
    <div class="count">مرة واحدة</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ</div>
    <div class="count">مرة واحدة</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ أَنْتَ رَبِّي لا إِلَـهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ</div>
    <div class="count">مرة واحدة — سيد الاستغفار</div>
    <div class="reference">رواه البخاري</div>
  </div>

  <div class="dhikr">
    <div class="arabic">سُبْحَانَ اللهِ وَبِحَمْدِهِ</div>
    <div class="count">100 مرة</div>
    <div class="reference">رواه مسلم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ</div>
    <div class="count">10 مرات أو 100 مرة</div>
    <div class="reference">رواه البخاري ومسلم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ</div>
    <div class="count">مرة واحدة — كلمتان حبيبتان إلى الرحمن، خفيفتان على اللسان، ثقيلتان في الميزان</div>
    <div class="reference">رواه البخاري ومسلم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي</div>
    <div class="count">مرة واحدة</div>
    <div class="reference">رواه أبو داود وابن ماجه</div>
  </div>

  <div class="dhikr">
    <div class="arabic">بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ</div>
    <div class="count">3 مرات</div>
    <div class="reference">رواه أبو داود والترمذي</div>
  </div>

  <div class="dhikr">
    <div class="arabic">رَضِيتُ بِاللهِ رَبًّا، وَبِالإِسْلاَمِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا</div>
    <div class="count">3 مرات</div>
    <div class="reference">رواه أبو داود والترمذي</div>
  </div>

  <div class="dhikr">
    <div class="arabic">يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ</div>
    <div class="count">مرة واحدة</div>
    <div class="reference">رواه الحاكم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ</div>
    <div class="count">100 مرة</div>
    <div class="reference">رواه البخاري ومسلم</div>
  </div>`;

const adhkarMasaHTML = `
  ${adhkarStyle}
  <h1>أذكار المساء</h1>

  <div class="dhikr">
    <div class="arabic">أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا</div>
    <div class="count">مرة واحدة</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ</div>
    <div class="count">مرة واحدة</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ أَنْتَ رَبِّي لا إِلَـهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ</div>
    <div class="count">مرة واحدة — سيد الاستغفار</div>
    <div class="reference">رواه البخاري</div>
  </div>

  <div class="dhikr">
    <div class="arabic">سُبْحَانَ اللهِ وَبِحَمْدِهِ</div>
    <div class="count">100 مرة</div>
    <div class="reference">رواه مسلم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ</div>
    <div class="count">3 مرات</div>
    <div class="reference">رواه مسلم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ</div>
    <div class="count">3 مرات</div>
    <div class="reference">رواه أبو داود والترمذي</div>
  </div>

  <div class="dhikr">
    <div class="arabic">رَضِيتُ بِاللهِ رَبًّا، وَبِالإِسْلاَمِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا</div>
    <div class="count">3 مرات</div>
    <div class="reference">رواه أبو داود والترمذي</div>
  </div>

  <div class="dhikr">
    <div class="arabic">اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي</div>
    <div class="count">مرة واحدة</div>
    <div class="reference">رواه أبو داود وابن ماجه</div>
  </div>

  <div class="dhikr">
    <div class="arabic">يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ</div>
    <div class="count">مرة واحدة</div>
    <div class="reference">رواه الحاكم</div>
  </div>

  <div class="dhikr">
    <div class="arabic">أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ</div>
    <div class="count">100 مرة</div>
    <div class="reference">رواه البخاري ومسلم</div>
  </div>`;

const openAdhkarPanel = (title, htmlContent) => {
  const panel = vscode.window.createWebviewPanel('adhkarPanel', title, vscode.ViewColumn.One, {
    enableScripts: false,
    retainContextWhenHidden: true,
  });
  panel.webview.html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body>${htmlContent}</body>
</html>`;
};

const showAdhkarNotification = (prayerName) => {
  const adhkarConfig = vscode.workspace.getConfiguration('prayerReminder');

  if (prayerName === 'Fajr' && adhkarConfig.get('adhkarSabah')) {
    vscode.window
      .showInformationMessage(
        "Don't forget your Morning Adhkar (أذكار الصباح)",
        'Read Adhkar'
      )
      .then((selection) => {
        if (selection === 'Read Adhkar') {
          openAdhkarPanel('أذكار الصباح', adhkarSabahHTML);
        }
      });
  }
  if (prayerName === 'Asr' && adhkarConfig.get('adhkarMasa')) {
    vscode.window
      .showInformationMessage(
        "Don't forget your Evening Adhkar (أذكار المساء)",
        'Read Adhkar'
      )
      .then((selection) => {
        if (selection === 'Read Adhkar') {
          openAdhkarPanel('أذكار المساء', adhkarMasaHTML);
        }
      });
  }
};

module.exports = {
  adhkarSabahHTML,
  adhkarMasaHTML,
  openAdhkarPanel,
  showAdhkarNotification,
};
