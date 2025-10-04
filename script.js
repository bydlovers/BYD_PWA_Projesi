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
                matrix[i - 1][j] + 1,      // Silme
                matrix[i][j - 1] + 1,      // Ekleme
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
 *
 * NOT: Bu fonksiyon artık kelime bazında skorlama için kullanılmaktadır.
 */
function benzerlikSkoruHesapla(aranacakMetin, arananTerim) {
    if (!arananTerim || aranacakMetin === undefined) return Infinity; 
    
    const text = aranacakMetin.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');
    const query = arananTerim.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');
    
    // 1. Mükemmel eşleşme/Substring önceliği (Sadece kelimenin bir kısmı yazılırsa)
    if (text.includes(query)) {
        return text.indexOf(query) * 0.01;
    }

    // 2. Levenshtein Uzaklığını Hesapla
    const uzaklik = levenshteinUzakligiHesapla(text, query);
    
    // HATA KONTROLÜ: Tek harf veya iki harf eksik yazımı kabul et (Lstik -> Lastik skor 1, ytkilen -> yetkilen skor 2)
    if (uzaklik <= 2) {
        return uzaklik;
    }
    
    // Uzaklık 2'den büyükse, kelime uzunluğu kısa ise alakasız kabul et.
    if (text.length < 6 && uzaklik > 1) {
        return Infinity;
    }

    // Uzun kelimeler için normalizasyon (Örn: "uzunbir kelime" aranan, "uzunkelime" bulunan)
    let score = uzaklik;
    score += Math.abs(text.length - query.length) * 0.2; 

    // Genel olarak 3'ten fazla skor alakasız sayılır
    if (score > 3.0) {
        return Infinity;
    }

    return score;
}

function gosterSonuclari(veri) {
    // ... (Bu kısım aynı kalmıştır)
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
// 4. GELİŞMİŞ ARAMA VE VURGULAMA MANTIĞI (ÇOKLU KELİME ODAKLI)
// =================================================================

/**
 * Ana arama/öneri motoru fonksiyonu. 
 * Aranan her kelimeyi (tam eşleşme veya düşük Levenshtein skoru) kayıtlarda arar ve skorlar.
 */
function aramaYap(aramaTerimi) {
    if (aramaTerimi.length < 2) {
        onerilerDiv.style.display = 'none';
        aktifOneriIndeksi = -1;
        return;
    }

    // Arama terimini kelimelere ayır (Örn: "Lastik Ayarı" -> ["lastik", "ayarı"])
    const aramaKelimeleri = aramaTerimi.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
    
    if (aramaKelimeleri.length === 0) {
        onerilerDiv.style.display = 'none';
        return;
    }

    const bulunanSonuclar = [];
    const MAX_ONERI_SKORU_TOPLAM = 5.0; // Tüm kelimelerin toplam skoru için üst eşik

    if (!byd_verileri || byd_verileri.length === 0) return; 

    byd_verileri.forEach((kayit, index) => {
        let toplamSkor = 0;
        let eslesenKelimeSayisi = 0;
        
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
            
            for (const kayitKelime of kayitKelimeleri) {
                const skor = benzerlikSkoruHesapla(kayitKelime, arananKelime);
                if (skor < enIyiKelimeSkoru) {
                    enIyiKelimeSkoru = skor;
                }
            }
            
            // Eğer en iyi skor 3'ten büyükse veya kelime bulunamazsa (Infinity), bu kelimeyi eşleşmemiş say
            if (enIyiKelimeSkoru <= 3.0) {
                toplamSkor += enIyiKelimeSkoru;
                eslesenKelimeSayisi++;
            } else {
                // Kelimelerden biri bile yeterince eşleşmezse, kaydı tamamen reddet (AND mantığı)
                toplamSkor = Infinity; 
                break;
            }
        }
        
        // Final