// =================================================================
// * Levenshtein Algoritması
// =================================================================
/**
 * Standart Levenshtein Uzaklığı algoritması.
 * İki kelime arasındaki minimum düzenleme sayısını (ekleme, çıkarma, değiştirme) hesaplar.
 * @param {string} s1 - İlk kelime (örnek: "lstik").
 * @param {string} s2 - İkinci kelime (örnek: "lastik").
 * @returns {number} Uzaklık skoru (0 = Mükemmel Eşleşme).
 */
function levenshteinUzakligiHesapla(s1, s2) {
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix = [];

    // Matrisi ilkle
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }

    // Matrisi doldur
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            const cost = (s2.charAt(i - 1) === s1.charAt(j - 1)) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,       // Silme
                matrix[i][j - 1] + 1,       // Ekleme
                matrix[i - 1][j - 1] + cost // Değiştirme
            );
        }
    }

    return matrix[s2.length][s1.length];
}

// =================================================================
// 1. DOM ELEMENTLERİ VE YARDIMCI DEĞİŞKENLER
// =================================================================

const aramaKutusu = document.getElementById('aramaKutusu');
const onerilerDiv = document.getElementById('oneriler');
const sonucAlani = document.getElementById('sonucAlani');
const sonucSoru = document.getElementById('sonucSoru');
const sonucCevap = document.getElementById('sonucCevap');
const sonucKategori = document.getElementById('sonucKategori');
const sonucEtiketler = document.getElementById('sonucEtiketler');
const sonucFoto = document.getElementById('sonucFoto'); 
const sonucVideo = document.getElementById('sonucVideo'); 
const sonucBelgeLink = document.getElementById('sonucBelgeLink'); 
const sonucJPGGosterici = document.getElementById('sonucJPGGosterici'); 
const cssLink = document.getElementById('cssLink');
const jsScript = document.getElementById('jsScript'); 

let byd_verileri = [];
let aktifOneriIndeksi = -1;

// =================================================================
// 2. YARDIMCI FONKSİYONLAR
// =================================================================

function extractVideoId(url) {
    if (!url) return null;
    let videoId = null;
    // YouTube linklerinin kısa/uzun, watch/shorts tüm formatlarını yakalar
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
}

/**
 * Ana benzerlik skorunu Levenshtein Uzaklığını kullanarak hesaplar.
 * Skor ne kadar düşükse o kadar yakındır (0 = Mükemmel Eşleşme).
 */
function benzerlikSkoruHesapla(aranacakMetin, arananTerim) {
    if (!arananTerim || aranacakMetin === undefined) return Infinity; 
    
    const text = aranacakMetin.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');
    const query = arananTerim.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');
    
    // 1. Mükemmel eşleşme/Substring önceliği (Tam kelime içinde geçme)
    if (text.includes(query)) {
        return text.indexOf(query) * 0.01; 
    }

    // 2. Levenshtein Uzaklığını Hesapla
    const uzaklik = levenshteinUzakligiHesapla(text, query);
    
    // HATA KONTROLÜ: Tek harf veya iki harf eksik yazımı kabul et (Lstik -> Lastik skor 1)
    if (uzaklik <= 2) {
        return uzaklik;
    }
    
    // Uzaklık 2'den büyükse, kelime uzunluğu kısa ise alakasız kabul et.
    if (text.length < 6 && uzaklik > 1) {
        return Infinity;
    }

    // Uzun kelimeler için normalizasyon 
    let score = uzaklik;
    score += Math.abs(text.length - query.length) * 0.2; 

    // Genel olarak 3.0'dan fazla skor alakasız sayılır
    if (score > 3.0) {
        return Infinity;
    }

    return score;
}

function gosterSonuclari(veri) {
    sonucAlani.style.display = 'block';
    
    sonucSoru.textContent = veri.soru; 
    sonucCevap.innerHTML = veri.cevap; 
    
    sonucKategori.textContent = veri.kategori;
    sonucEtiketler.textContent = Array.isArray(veri.etiketler) && veri.etiketler.length > 0
                                 ? veri.etiketler.join(', ')  
                                 : 'Etiket bulunmamaktadır.';
    
    if(sonucJPGGosterici) sonucJPGGosterici.innerHTML = '';
    if(sonucBelgeLink) sonucBelgeLink.innerHTML = '';
    
    if (veri.belge && sonucJPGGosterici && sonucBelgeLink) {
        const sayfaNumaralari = String(veri.belge).split(',').map(s => s.trim()).filter(s => s.length > 0);
        let JPGGostericiHTML = '';
        
        sayfaNumaralari.forEach(sayfaNo => {
            const temizSayfaNo = sayfaNo.replace(/[^a-zA-Z0-9_]/g, '');
            const JPGYolu = `/BYD_PWA_Projesi/kilavuz/kil_${temizSayfaNo}.jpg`; 
            
            JPGGostericiHTML += `
                <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <h5 class="sonuc-baslik" style="background-color: #f7f7f7; padding: 10px; margin: 0; font-size: 1em; color: #333;">
                        Kılavuz Sayfa ${sayfaNo}
                    </h5>
                    <iframe 
                        src="${JPGYolu}" 
                        style="width: 100%; height: 600px; border: none; display: block;" 
                        frameborder="0">
                        Bu tarayıcı iFrame'i desteklemiyor.
                    </iframe>
                </div>
            `;

            sonucBelgeLink.innerHTML += `
                        <a href="${JPGYolu}" target="_blank" style="
                            display: inline-block;
                            margin: 5px 10px 5px 0;
                            color: #007AFF; 
                            font-weight: 500;">
                            Sayfa ${sayfaNo}'yu Yeni Sekmede Aç
                        </a>
            `;
        });
        
        sonucJPGGosterici.innerHTML = JPGGostericiHTML;

    } else {
        if (sonucJPGGosterici) {
            sonucJPGGosterici.textContent = "İlgili kılavuz belgesi bulunmamaktadır.";
        }
    }
    
    if (veri.foto) {
        const resimSrc = veri.foto;
        const resimHTML = `
            <img src="${resimSrc}" alt="BYD Bilgi Görseli">`;
        sonucFoto.innerHTML = resimHTML;
    } else {
        sonucFoto.innerHTML = "Görsel bulunmamaktadır.";
    }
    
    const videoId = extractVideoId(veri.video); 
    
    if (videoId) {
        const iframeHTML = `
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: black; border-radius: 8px;">
                <iframe 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
        sonucVideo.innerHTML = iframeHTML;
    } else {
        sonucVideo.innerHTML = `Video bulunmamaktadır veya link geçersizdir.`;
    }
    
    aramaKutusu.value = '';
    aramaKutusu.focus(); 

    sonucAlani.scrollIntoView({ behavior: 'smooth' });
}

// =================================================================
// 3. VERİ YÜKLEME VE BAŞLATMA
// =================================================================

async function verileriYukle() {
    try {
        const response = await fetch('/BYD_PWA_Projesi/data.json'); 
        
        if (!response.ok) {
            const errorMsg = `Sunucu Hatası: ${response.status}. JSON dosyasına erişilemiyor.`;
            throw new Error(errorMsg);
        }
        
        const tamVeri = await response.json();
        
        if (tamVeri.versiyon && cssLink) {
            const versiyon = tamVeri.versiyon;
            cssLink.href = `style.css?v=${versiyon}`;
            console.log(`Versiyon başarıyla uygulandı: v${versiyon}`);
        }

        byd_verileri = tamVeri.veriler; 
        
        console.log("Veriler başarıyla yüklendi.");
        aramaKutusu.placeholder = "Soru, kategori veya etiket yazmaya başlayın...";

    } catch (error) {
        console.error("Veri yüklenirken bir hata oluştu:", error);
        aramaKutusu.placeholder = "HATA: Veriler yüklenemedi. Sunucu erişimi hatası.";
        aramaKutusu.disabled = true; 
    }
}

verileriYukle();

// =================================================================
// 4. GELİŞMİŞ ARAMA VE FİLTRELEME MANTIĞI (ÇOKLU KELİME ODAKLI)
// =================================================================

/**
 * Ana arama/öneri motoru fonksiyonu. 
 * Aranan her kelimeyi (tam eşleşme, düşük Levenshtein skoru veya başlangıç eşleşmesi) kayıtlarda arar ve skorlar.
 */
function aramaYap(aramaTerimi) {
    if (aramaTerimi.length < 2) {
        onerilerDiv.style.display = 'none';
        aktifOneriIndeksi = -1;
        return;
    }

    // Arama terimini kelimelere ayır (Örn: "Lastik Ayarı" -> ["lastik", "ayarı"])
    const aramaKelimeleri = aramaTerimi.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0); 
    
    if (aramaKelimeleri.length === 0) {
        onerilerDiv.style.display = 'none';
        return;
    }

    const bulunanSonuclar = [];
    const MAX_ONERI_SKORU_TOPLAM = 5.0; 

    if (!byd_verileri || byd_verileri.length === 0) return; 

    byd_verileri.forEach((kayit, index) => {
        let toplamSkor = 0;
        let eslesenKelimeSayisi = 0;
        
        // Kaydın tüm metinlerini birleştir
        const kaynakMetinler = [
            kayit.soru,
            kayit.cevap,
            kayit.kategori,
            (Array.isArray(kayit.etiketler) ? kayit.etiketler.join(' ') : kayit.etiketler)
        ].join(' ').toLowerCase();

        // Her bir arama kelimesini kaydın içindeki en iyi eşleşen kelimeyle skorla
        for (const arananKelime of aramaKelimeleri) {
            
            // Kayıttaki tüm kelimeler arasında en iyi Levenshtein eşleşmesini bul
            const kayitKelimeleri = kaynakMetinler.split(/\s+/).filter(w => w.length > 1);
            let enIyiKelimeSkoru = Infinity;
            
            let MaxSkorListeleme = 3.0;
            // Eğer aranan kelime çok kısaysa (4 harften az), listelemek için çok daha katı bir skor iste
            if (arananKelime.length < 4) { 
                MaxSkorListeleme = 1.0; 
            }
            
            for (const kayitKelime of kayitKelimeleri) {
                const skor = benzerlikSkoruHesapla(kayitKelime, arananKelime);
                if (skor < enIyiKelimeSkoru) {
                    enIyiKelimeSkoru = skor;
                }
            }
            
            // Eğer Levenshtein skoru izin verilen eşiği aşarsa (Örnek: ytk aramasında MaxSkorListeleme = 1.0)
            if (enIyiKelimeSkoru > MaxSkorListeleme) {
                
                // EK KONTROL: Eğer aranan kelime, kaydın içindeki herhangi bir kelimenin BAŞLANGICINA çok benziyorsa (Kısaltmalar için)
                let baslangicEslesmesiVar = false;
                for (const kayitKelime of kayitKelimeleri) {
                    if (kayitKelime.length >= arananKelime.length) {
                        const baslangic = kayitKelime.substring(0, arananKelime.length);
                        // Başlangıç Levenshtein skoru kontrolü (Çok katı: 0 veya 1 hata)
                        if (levenshteinUzakligiHesapla(baslangic, arananKelime) <= 1) { 
                            baslangicEslesmesiVar = true;
                            break;
                        }
                    }
                }

                if (baslangicEslesmesiVar) {
                     // Başlangıç eşleşmesi varsa, düşük bir ceza puanı vererek kabul et
                    toplamSkor += 1.5; 
                    eslesenKelimeSayisi++;
                } else {
                    // Ne Levenshtein ne de başlangıç eşleşmesi varsa, tamamen reddet (AND mantığı)
                    toplamSkor = Infinity;
                    break;
                }

            } else {
                // Levenshtein skoru eşikte veya altındaysa (Normal ve kısa kelimelerde 1.0)
                toplamSkor += enIyiKelimeSkoru;
                eslesenKelimeSayisi++;
            }
        }
        
        // Final filtreleme: Tüm kelimeler eşleşmeli ve toplam skor eşiği geçmemeli
        if (toplamSkor !== Infinity && eslesenKelimeSayisi === aramaKelimeleri.length && toplamSkor < MAX_ONERI_SKORU_TOPLAM) {
            bulunanSonuclar.push({
                ...kayit,
                skor: toplamSkor,
                index: index 
            });
        }
    });

    // Skora göre sırala
    bulunanSonuclar.sort((a, b) => a.skor - b.skor);

    const oneriler = bulunanSonuclar.slice(0, 10);
    gosterOneriListesi(oneriler, aramaKelimeleri);
}

/**
 * Öneri listesi HTML'ini oluşturur ve gösterir.
 * @param {Array<Object>} oneriler - Skorlanmış ve sıralanmış kayıtlar dizisi
 * @param {Array<string>} aramaKelimeleri - aramaYap'tan gelen küçük harfli arama kelimeleri
 */
function gosterOneriListesi(oneriler, aramaKelimeleri) {
    onerilerDiv.innerHTML = '';
    aktifOneriIndeksi = -1;
    
    if (oneriler.length > 0) {
        
        oneriler.forEach((kayit, listIndex) => {
            const oneriItem = document.createElement('div');
            oneriItem.classList.add('oneri-item');
            
            let vurgulanmisSoru = kayit.soru;
            
            // Vurgulama Mantığı: Sadece en iyi eşleşen kelimeyi bul ve bold yap
            if (aramaKelimeleri && aramaKelimeleri.length > 0) {
                
                const soruKelimeleri = kayit.soru.split(/\s+/).filter(w => w.length > 0);
                
                aramaKelimeleri.forEach(arananTerim => {
                    let enIyiSoruKelime = '';
                    let enDusukSkor = Infinity;
                    
                    soruKelimeleri.forEach(soruKelime => {
                        
                        const kucukSoruKelime = soruKelime.toLowerCase();
                        
                        // 1. ÖNCELİK: SUBSTRING KONTROLÜ (Kısmi Eşleşme - bas -> basıncı)
                        // Arama terimi, soru kelimesini içeriyorsa (basıncı.includes(basın))
                        if (kucukSoruKelime.includes(arananTerim)) {
                            // Substring eşleşmesi varsa, en iyi skor (0) ile hemen kabul et.
                            if (0 < enDusukSkor) {
                                enIyiSoruKelime = soruKelime;
                                enDusukSkor = 0; 
                            }
                            // Eğer mükemmel eşleşme varsa, Levenshtein'a bakmaya gerek yok.
                            if (enDusukSkor === 0) return; 
                        }
                        
                        // 2. ÖNCELİK: LEVENSHTEIN (Hatalı Yazım - lstik -> lastik)
                        const skor = benzerlikSkoruHesapla(soruKelime, arananTerim);
                        
                        // Vurgulama toleransı 1.1'e düşürüldü. (Sadece tek harf hatalı yazımları boldla)
                        // Bu, "nasıl" gibi alakasız kelimelerin yanlışlıkla bold yapılmasını engeller.
                        if (skor < 1.1 && skor < enDusukSkor) { 
                            enDusukSkor = skor;
                            enIyiSoruKelime = soruKelime;
                        }
                    });

                    // Eğer tatmin edici bir kelime bulunduysa, o kelimeyi vurgula
                    if (enIyiSoruKelime) {
                        // Vurgulama işlemi (büyük/küçük harf duyarsız, sadece tam kelime)
                        const regex = new RegExp(`\\b(${enIyiSoruKelime})\\b`, 'gi');
                        // Vurgulamayı yalnızca bir kez yap (en alakalı olanı)
                        if (vurgulanmisSoru.search(regex) !== -1) {
                            vurgulanmisSoru = vurgulanmisSoru.replace(regex, '<b>$1</b>');
                        }
                    }
                });
            }
            
            // Öneriye kategori bilgisini ekle
            oneriItem.innerHTML = `${vurgulanmisSoru} <span style="font-size: 0.8em; color: #999;">(${kayit.kategori})</span>`;
            
            oneriItem.dataset.veriIndeksi = kayit.index; 

            oneriItem.addEventListener('click', function() {
                aramaKutusu.value = kayit.soru; 
                onerilerDiv.style.display = 'none';
                gosterSonuclari(kayit);
            });
            
            onerilerDiv.appendChild(oneriItem);
        });
        
        onerilerDiv.style.display = 'block';
    } else {
        onerilerDiv.style.display = 'none';
    }
}

// =================================================================
// 5. OLAY DİNLEYİCİLERİ
// =================================================================

// 1. INPUT OLAYI: Her tuşa basıldığında arama yap
aramaKutusu.addEventListener('input', function() {
    aramaYap(aramaKutusu.value);
});

// 2. KLAVYE GEZİNTİSİ: Ok tuşları (Up/Down) ve Enter tuşu olaylarını yönetme
aramaKutusu.addEventListener('keydown', function(e) {
    const oneriler = onerilerDiv.getElementsByClassName('oneri-item');
    if (oneriler.length === 0) return;

    function secimiTemizle() {
        Array.from(oneriler).forEach(item => item.classList.remove('aktif-oneri'));
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault(); 
        secimiTemizle();
        aktifOneriIndeksi = (aktifOneriIndeksi + 1) % oneriler.length;
        oneriler[aktifOneriIndeksi].classList.add('aktif-oneri');
        
        const veriIndeksi = parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi);
        aramaKutusu.value = byd_verileri[veriIndeksi].soru;

    } else if (e.key === 'ArrowUp') {
        e.preventDefault(); 
        secimiTemizle();
        aktifOneriIndeksi = (aktifOneriIndeksi - 1 + oneriler.length) % oneriler.length;
        oneriler[aktifOneriIndeksi].classList.add('aktif-oneri');
        
        const veriIndeksi = parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi);
        aramaKutusu.value = byd_verileri[veriIndeksi].soru;

    } else if (e.key === 'Enter') {
        if (aktifOneriIndeksi > -1) {
            e.preventDefault(); 
            
            const secilenItem = oneriler[aktifOneriIndeksi];
            const veriIndeksi = parseInt(secilenItem.dataset.veriIndeksi);
            
            onerilerDiv.style.display = 'none'; 
            aktifOneriIndeksi = -1;
            gosterSonuclari(byd_verileri[veriIndeksi]);
        }
    }
});
    
// 3. Kutudan çıkıldığında önerileri gizle
aramaKutusu.addEventListener('blur', function() {
    // Tıklama olayının tetiklenmesi için küçük bir gecikme ekle
    setTimeout(() => {
        onerilerDiv.style.display = 'none';
        aktifOneriIndeksi = -1;
    }, 150); 
});

// =================================================================
// 6. YENİ: ÇÖZÜM BULAMADIM / IFRAME MANTIĞI
// =================================================================

const cozumBulamadimButton = document.getElementById('cozumBulamadimButton');
const feedbackFormContainer = document.getElementById('feedbackFormContainer');
const googleFeedbackIframe = document.getElementById('googleFeedbackIframe');

/**
 * "Çözüm Bulamadım" butonuna tıklandığında IFRAME formunu gösterir/gizler.
 */
cozumBulamadimButton.addEventListener('click', function() {
    // Formun görünürlük durumunu değiştir
    if (feedbackFormContainer.classList.contains('feedback-form-visible')) {
        feedbackFormContainer.classList.remove('feedback-form-visible');
        feedbackFormContainer.classList.add('feedback-form-hidden');
        cozumBulamadimButton.textContent = "Çözüm bulamadım 😞";
    } else {
        feedbackFormContainer.classList.remove('feedback-form-hidden');
        feedbackFormContainer.classList.add('feedback-form-visible');
        cozumBulamadimButton.textContent = "Geri bildirimi gizle ▲";
        
        // Iframe içine odaklanma mümkün olmayabilir, ancak scroll'u getiririz.
        feedbackFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// =================================================================
// 7. YENİ: BEĞEN/BEĞENME İŞLEVSELLİĞİ (Statik)
// =================================================================

const beğenButton = document.getElementById('beğenButton');
const beğenmeButton = document.getElementById('beğenmeButton');
const feedbackMesaj = document.getElementById('feedbackMesaj');

/**
 * Geri besleme butonlarına tıklama olaylarını ekler.
 * (Ücretli hosting'e geçildiğinde bu fonksiyona API çağrısı eklenecektir.)
 * @param {boolean} basarili - İşlem başarılı mı (true=Beğen, false=Beğenme)
 */
function handleFeedback(basarili) {
    const mesaj = basarili 
        ? "✅ Geri bildiriminiz için teşekkürler! Bu çözümün işinize yaramasına sevindik."
        : "❌ Üzgünüz, aradığınızı bulamadınız. Geri bildiriminizi dikkate alacağız.";
    
    feedbackMesaj.textContent = mesaj;
    feedbackMesaj.style.display = 'block';

    // Butonları devre dışı bırak (Kullanıcının sadece bir kere oy kullanması için)
    beğenButton.disabled = true;
    beğenmeButton.disabled = true;

    // 5 saniye sonra mesajı gizle ve butonları tekrar etkinleştir
    setTimeout(() => {
        feedbackMesaj.style.display = 'none';
        beğenButton.disabled = false;
        beğenmeButton.disabled = false;
    }, 5000);
}

// Olay Dinleyicileri Ekle
beğenButton.addEventListener('click', () => handleFeedback(true));
beğenmeButton.addEventListener('click', () => handleFeedback(false));