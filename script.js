// =================================================================
// 1. DOM ELEMENTLERİ VE YARDIMCI DEĞİŞKENLER
// =================================================================

// Gerekli DOM elemanlarını seçme
const aramaKutusu = document.getElementById('aramaKutusu');
const onerilerDiv = document.getElementById('oneriler');
const sonucAlani = document.getElementById('sonucAlani');
const sonucSoru = document.getElementById('sonucSoru');
const sonucCevap = document.getElementById('sonucCevap');
const sonucKategori = document.getElementById('sonucKategori');
const sonucEtiketler = document.getElementById('sonucEtiketler');
const sonucFoto = document.getElementById('sonucFoto'); 
const sonucVideo = document.getElementById('sonucVideo'); 
 
// HTML'de YAPILAN DEĞİŞİKLİKLERE UYGUN YENİ BELGE ALANI TANIMLAMALARI
const sonucBelgeLink = document.getElementById('sonucBelgeLink'); 
const sonucJPGGosterici = document.getElementById('sonucJPGGosterici'); 

// Versiyon yönetimindeki HTML elementlerini seçme
const cssLink = document.getElementById('cssLink');
const jsScript = document.getElementById('jsScript'); 

// Veri değişkenleri
let byd_verileri = [];
let aktifOneriIndeksi = -1;

// =================================================================
// 2. YARDIMCI FONKSİYONLAR
// =================================================================

// YARDIMCI FONKSİYON: YouTube URL'sinden Video ID'sini çeker (Tüm formatları destekler)
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
 * Aranan terim ile metin arasındaki basit benzerlik skorunu hesaplar. (FUZZY MATCHING)
 * Skor ne kadar düşükse o kadar yakındır (0 = Mükemmel Eşleşme).
 * @param {string} aranacakMetin - Aranacak metin (Soru, Etiket, Cevap).
 * @param {string} arananTerim - Kullanıcının girdiği terim (Örn: "lstik").
 * @returns {number} Benzerlik skoru (0=Mükemmel Eşleşme, Infinity=Eşleşme yok).
 */
function benzerlikSkoruHesapla(aranacakMetin, arananTerim) {
    if (!arananTerim || aranacakMetin === undefined) return Infinity; 
    
    // Metinleri temizle ve küçük harfe çevir
    const text = aranacakMetin.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');
    const query = arananTerim.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '');

    // 1. Mükemmel Eşleşme Skoru (Tam olarak içeriyorsa en yüksek öncelik)
    if (text.includes(query)) {
        // Skoru, eşleşmenin metnin neresinde başladığına göre belirle (başlangıçta olması daha iyi)
        return text.indexOf(query) * 0.01;
    }

    // 2. Basit Yazım Hatası Toleransı (Approximate Substring Match)
    let score = 0;

    for (let i = 0; i < query.length; i++) {
        // Karakterin aranacak metinde hiç geçmemesi büyük ceza
        if (text.indexOf(query[i]) === -1) {
            score += 2;
        } else {
            // Karakterler arası mesafeyi ve sırayı kontrol et (Sıra bozukluğu cezası)
            const lastIndex = i > 0 ? text.indexOf(query[i - 1]) : -1;
            const currentIndex = text.indexOf(query[i], lastIndex + 1);
            if (currentIndex === -1) {
                score += 1.5; 
            } else {
                score += (currentIndex - lastIndex) * 0.1;
            }
        }
    }
    
    // Eğer skor çok yüksekse, alakasız kabul et
    if (score > 5 && score > query.length * 2) {
        return Infinity;
    }
    
    // Uzunluk farkına göre skor ekle
    score += Math.abs(text.length - query.length) * 0.5;

    return score;
}

/**
 * Seçilen verinin sonuçlarını ekranda gösteren fonksiyon
 * @param {Object} veri - Gösterilecek veri kaydı
 */
function gosterSonuclari(veri) {
    sonucAlani.style.display = 'block';
    
    // Soru başlığını HTML olarak ayarlayalım
    sonucSoru.textContent = veri.soru; 
    
    // Cevap metnini HTML olarak ayarlayalım (TinyMCE ile gelen HTML içeriğini desteklemek için)
    sonucCevap.innerHTML = veri.cevap; 
    
    sonucKategori.textContent = veri.kategori;
    sonucEtiketler.textContent = Array.isArray(veri.etiketler) && veri.etiketler.length > 0
                             ? veri.etiketler.join(', ')  
                             : 'Etiket bulunmamaktadır.';
    
    // Belge/JPG Gösterme Mantığı
    if(sonucJPGGosterici) sonucJPGGosterici.innerHTML = '';
    if(sonucBelgeLink) sonucBelgeLink.innerHTML = '';
    
    if (veri.belge && sonucJPGGosterici && sonucBelgeLink) {
        const sayfaNumaralari = String(veri.belge).split(',').map(s => s.trim()).filter(s => s.length > 0);
        let JPGGostericiHTML = '';
        
        sayfaNumaralari.forEach(sayfaNo => {
            const temizSayfaNo = sayfaNo.replace(/[^a-zA-Z0-9_]/g, '');
            const JPGYolu = `/BYD_PWA_Projesi/kilavuz/kil_${temizSayfaNo}.jpg`; // YOL DÜZELTİLDİ
            
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
    
    // Fotoğraf mantığı
    if (veri.foto) {
        const resimSrc = veri.foto;
        const resimHTML = `
            <img src="${resimSrc}" alt="BYD Bilgi Görseli">`;
        sonucFoto.innerHTML = resimHTML;
    } else {
        sonucFoto.innerHTML = "Görsel bulunmamaktadır.";
    }
    
    // Video mantığı
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
    
    // Temizlik ve Odaklanma
    aramaKutusu.value = '';
    aramaKutusu.focus(); 

    // Sonuç alanına kaydır
    sonucAlani.scrollIntoView({ behavior: 'smooth' });
}

// =================================================================
// 3. VERİ YÜKLEME VE BAŞLATMA
// =================================================================

// script.js - verileriYukle fonksiyonu
async function verileriYukle() {
    try {
        const response = await fetch('/BYD_PWA_Projesi/data.json'); 
        
        if (!response.ok) {
            const errorMsg = `Sunucu Hatası: ${response.status}. JSON dosyasına erişilemiyor.`;
            throw new Error(errorMsg);
        }
        
        const tamVeri = await response.json();
        
        // 1. VERSİYON KONTROLÜ VE UYGULAMASI
        if (tamVeri.versiyon && cssLink) {
            const versiyon = tamVeri.versiyon;
            cssLink.href = `style.css?v=${versiyon}`;
            console.log(`Versiyon başarıyla uygulandı: v${versiyon}`);
        }

        // 2. VERİLERİN YÜKLENMESİ
        byd_verileri = tamVeri.veriler; 
        
        console.log("Veriler başarıyla yüklendi.");
        aramaKutusu.placeholder = "Soru, kategori veya etiket yazmaya başlayın...";

    } catch (error) {
        console.error("Veri yüklenirken bir hata oluştu:", error);
        aramaKutusu.placeholder = "HATA: Veriler yüklenemedi. Sunucu erişimi hatası.";
        aramaKutusu.disabled = true; 
    }
}

// Sayfa yüklendiğinde verileri çek
verileriYukle();

// =================================================================
// 4. GELİŞMİŞ ARAMA (FUZZY MATCHING) MANTIĞI
// =================================================================

/**
 * Ana arama/öneri motoru fonksiyonu. Fuzzy matching ve skorlamayı uygular.
 */
function aramaYap(aramaTerimi) {
    // Arama terimi yoksa veya çok kısaysa önerileri gizle
    if (aramaTerimi.length < 2) {
        onerilerDiv.style.display = 'none';
        aktifOneriIndeksi = -1;
        return;
    }

    const terim = aramaTerimi.toLowerCase().trim();
    const bulunanSonuclar = [];

    if (!byd_verileri || byd_verileri.length === 0) return; 

    byd_verileri.forEach((kayit, index) => {
        let skor = Infinity;

        // Bütün metinleri (Soru, Kategori, Etiketler) tek bir dizeye dönüştürün
        const kaynakMetinler = [
            kayit.soru,
            kayit.kategori,
            (Array.isArray(kayit.etiketler) ? kayit.etiketler.join(' ') : kayit.etiketler)
        ].join(' '); 

        // 1. Öncelikli Alanlarda (Soru, Etiket) Skorlama
        skor = benzerlikSkoruHesapla(kaynakMetinler, terim);
        
        // 2. Cevap Metni Eşleşmeleri (Daha Düşük Öncelik)
        // Eğer skor hala yüksekse (öncelikli alanda iyi bir eşleşme bulunmadıysa) cevap metnine bak
        if (skor >= 1.5) { // İyi bir tam eşleşme yoksa (skor 1.5'ten büyükse)
            const cevapSkoru = benzerlikSkoruHesapla(kayit.cevap, terim);
            
            // Cevap metnindeki eşleşmenin skorunu daha düşük öncelikli hale getir (örn: 3 ekleyerek)
            if (cevapSkoru !== Infinity) {
                // Öncelikli alanlardaki skordan daha iyi değilse bile, bir sonuç olarak kalsın
                skor = Math.min(skor, cevapSkoru + 3); 
            }
        }

        // Geçerli bir skor varsa listeye ekle
        if (skor !== Infinity) {
            bulunanSonuclar.push({
                ...kayit,
                skor: skor,
                index: index // Klavye gezintisi için orijinal indeksi sakla
            });
        }
    });

    // Skora göre sırala (Düşük skor = Daha iyi eşleşme)
    bulunanSonuclar.sort((a, b) => a.skor - b.skor);

    // İlk 10 sonucu al
    const oneriler = bulunanSonuclar.slice(0, 10);
    
    // Öneri listesini güncelle
    gosterOneriListesi(oneriler);
}

/**
 * Öneri listesi HTML'ini oluşturur ve gösterir.
 * @param {Array<Object>} oneriler - Skorlanmış ve sıralanmış kayıtlar dizisi
 */
function gosterOneriListesi(oneriler) {
    onerilerDiv.innerHTML = '';
    aktifOneriIndeksi = -1;
    
    if (oneriler.length > 0) {
        const aramaTerimi = aramaKutusu.value.trim();
        
        oneriler.forEach((kayit, listIndex) => {
            const oneriItem = document.createElement('div');
            oneriItem.classList.add('oneri-item');
            
            // 1. Vurgulama Mantığı (Fuzzy Matching için geliştirildi)
            let vurgulanmisSoru = kayit.soru;
            
            if (aramaTerimi.length >= 2) {
                
                // Kaydın tüm anahtar kelimelerini ayır
                const tumKelimeler = [
                    ...kayit.soru.toLowerCase().split(/\s+/), 
                    ...kayit.kategori.toLowerCase().split(/\s+/), 
                    ...(Array.isArray(kayit.etiketler) ? kayit.etiketler.map(e => e.toLowerCase()) : [])
                ];
                
                let enIyiEslesme = '';
                let enDusukSkor = Infinity;
                
                // Tüm kelimeler arasında arama terimiyle en yakın olanı bul
                tumKelimeler.forEach(kelime => {
                    const skor = benzerlikSkoruHesapla(kelime, aramaTerimi);
                    // Sadece çok yakın eşleşmeleri dikkate al (skor 2.0'dan küçük)
                    if (skor < 2.0 && skor < enDusukSkor) {
                        enDusukSkor = skor;
                        enIyiEslesme = kelime;
                    }
                });

                // Eğer tatmin edici bir kelime bulunduysa, o kelimeyi vurgula
                if (enIyiEslesme) {
                    // Kayıttaki orijinal kelimeyi (büyük/küçük harf duyarlı) bulmak için RegExp kullanılır
                    const regex = new RegExp(`(${enIyiEslesme})`, 'gi');
                    vurgulanmisSoru = kayit.soru.replace(regex, '<b>$1</b>');
                } else {
                    // Eğer fuzzy match çok zayıfsa, yine de kullanıcının tam girdiği terimi vurgulamayı dene
                    const regex = new RegExp(`(${aramaTerimi})`, 'gi');
                    vurgulanmisSoru = kayit.soru.replace(regex, '<b>$1</b>');
                }
            }
            
            // 2. Öneriye kategori bilgisini ekle
            oneriItem.innerHTML = `${vurgulanmisSoru} <span style="font-size: 0.8em; color: #999;">(${kayit.kategori})</span>`;
            
            // 3. Veri indeksini klavye gezintisi için sakla
            oneriItem.dataset.veriIndeksi = kayit.index; 

            // 4. Mouse tıklama olayı
            oneriItem.addEventListener('click', function() {
                aramaKutusu.value = kayit.soru; 
                onerilerDiv.style.display = 'none';
                gosterSonuclari(kayit);
            });
            
            // 5. Listeye ekle
            onerilerDiv.appendChild(oneriItem);
        });
        
        onerilerDiv.style.display = 'block';
    } else {
        // Eşleşme yoksa gizle
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
        
        // Kutudaki değeri seçilen önerinin sorusu ile güncelle
        const veriIndeksi = parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi);
        aramaKutusu.value = byd_verileri[veriIndeksi].soru;

    } else if (e.key === 'ArrowUp') {
        e.preventDefault(); 
        secimiTemizle();
        aktifOneriIndeksi = (aktifOneriIndeksi - 1 + oneriler.length) % oneriler.length;
        oneriler[aktifOneriIndeksi].classList.add('aktif-oneri');
        
        // Kutudaki değeri seçilen önerinin sorusu ile güncelle
        const veriIndeksi = parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi);
        aramaKutusu.value = byd_verileri[veriIndeksi].soru;

    } else if (e.key === 'Enter') {
        if (aktifOneriIndeksi > -1) {
            e.preventDefault(); 
            
            const secilenItem = oneriler[aktifOneriIndeksi];
            const veriIndeksi = parseInt(secilenItem.dataset.veriIndeksi);
            
            onerilerDiv.style.display = 'none'; // Önerileri gizle
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