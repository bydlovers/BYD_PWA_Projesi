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
    // Eski: const sonucBelge = document.getElementById('sonucBelge'); ARTIK KULLANILMIYOR
    const sonucBelgeLink = document.getElementById('sonucBelgeLink'); // Yedek linkler için
    const sonucJPGGosterici = document.getElementById('sonucJPGGosterici'); // iFrame'ler için

    // Versiyon yönetimindeki HTML elementlerini seçme
    const cssLink = document.getElementById('cssLink');
    const jsScript = document.getElementById('jsScript'); 

    // Veri değişkenleri
    let byd_verileri = [];
    let aktifOneriIndeksi = -1;

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

// script.js - verileriYukle fonksiyonu
async function verileriYukle() {
    try {
        // !!! KRİTİK DEĞİŞİKLİK BURADA !!!
        // GitHub Pages için depo adını yola ekliyoruz
        const response = await fetch('/byd-destek-pwa/data.json'); 
        
        if (!response.ok) {
            const errorMsg = `Sunucu Hatası: ${response.status}. JSON dosyasına erişilemiyor.`;
            throw new Error(errorMsg);
        }
        
        const tamVeri = await response.json();
        
        // 1. VERSİYON KONTROLÜ VE UYGULAMASI (Önbellek aşımı için)
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
    
    // Seçilen verinin sonuçlarını ekranda gösteren fonksiyon
    function gosterSonuclari(veri) {
        sonucAlani.style.display = 'block';
        sonucCevap.innerHTML = veri.cevap;
        sonucCevap.textContent = veri.cevap;
        
        sonucKategori.textContent = veri.kategori;
		sonucEtiketler.textContent = Array.isArray(veri.etiketler) && veri.etiketler.length > 0
                             ? veri.etiketler.join(', ') 
                             : 'Etiket bulunmamaktadır.';
        
        // **JPG GÖSTERME MANTIĞI (iFrame ENTEGRASYONU)**
        
        // Her çağrıda önceki içeriği temizle
        if(sonucJPGGosterici) sonucJPGGosterici.innerHTML = '';
        if(sonucBelgeLink) sonucBelgeLink.innerHTML = '';
        
        if (veri.belge && sonucJPGGosterici && sonucBelgeLink) {
            const sayfaNumaralari = String(veri.belge).split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            let JPGGostericiHTML = '';
            
            sayfaNumaralari.forEach(sayfaNo => {
                const temizSayfaNo = sayfaNo.replace(/[^a-zA-Z0-9_]/g, '');
                const JPGYolu = `kilavuz/kil_${temizSayfaNo}.jpg`;
                
                // Her sayfa için ayrı bir iFrame oluştur
                JPGGostericiHTML += `
                    <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                        <h5 style="background-color: #f7f7f7; padding: 10px; margin: 0; font-size: 1em; color: #333;">
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

                // Yedek bağlantıları oluşturma (iFrame başarısız olursa)
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
            // Eğer veri yoksa veya HTML elementleri bulunamazsa mesaj göster
            if (sonucJPGGosterici) {
                sonucJPGGosterici.textContent = "İlgili kılavuz belgesi bulunmamaktadır.";
            }
        }
        
        // Fotoğraf mantığı
        if (veri.foto) {
            const resimSrc = veri.foto;
            const resimHTML = `
                <img src="${resimSrc}" alt="BYD Bilgi Görseli" style="
                    width: 100%; 
                    height: auto; 
                    display: block; 
                    border-radius: 8px; 
                    margin-top: 10px; 
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);"
                >`;
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
        
        // Sonuçlar gösterildikten hemen sonra arama kutusunu temizle
        aramaKutusu.value = '';
        aramaKutusu.focus(); // Yeni arama yapmaya hazır olması için odaklan

        // Sonuç alanına kaydır
        sonucAlani.scrollIntoView({ behavior: 'smooth' });
    }

    // SUGGEST FONKSİYONU: Arama ve Öneri Mantığı
    aramaKutusu.addEventListener('input', function() {
        const inputDegeri = aramaKutusu.value.toLowerCase().trim();
        
        // Öneri alanını temizle ve aktif indeksi sıfırla
        onerilerDiv.innerHTML = '';
        aktifOneriIndeksi = -1;
        
        // Gerekli kontrol
        if (inputDegeri.length < 2) {
            return;
        }

        // FİLTRELEME: Soru Cümlesinde VEYA Etiketlerde Eşleşme
        const eslesenler = byd_verileri.filter(veri => 
    	veri.soru.toLowerCase().includes(inputDegeri) ||
    	(Array.isArray(veri.etiketler) && veri.etiketler.some(etiket => etiket.toLowerCase().includes(inputDegeri)))
		);

        eslesenler.forEach(veri => {
            const oneriItem = document.createElement('div');
            oneriItem.classList.add('oneri-item');
            
            // Vurgulama
            const vurgulanmisSoru = veri.soru.replace(
                new RegExp(inputDegeri, "gi"),
                (eslesen) => `<b>${eslesen}</b>`
            );
            
            // Öneriye kategori bilgisini ekle
            oneriItem.innerHTML = `${vurgulanmisSoru} <span style="font-size: 0.8em; color: #999;">(${veri.kategori})</span>`;
            
            // Mouse tıklama olayı
            oneriItem.addEventListener('click', function() {
                aramaKutusu.value = veri.soru; 
                onerilerDiv.innerHTML = '';
                gosterSonuclari(veri);
            });
            
            oneriItem.dataset.veriIndeksi = byd_verileri.indexOf(veri);

            // Hata Düzeltmesi: oneriItem'ı ekle
            onerilerDiv.appendChild(oneriItem);
        });
    });

    // KLAVYE GEZİNTİSİ: Ok tuşları (Up/Down) ve Enter tuşu olaylarını yönetme
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
            aramaKutusu.value = byd_verileri[parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi)].soru;

        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); 
            secimiTemizle();
            aktifOneriIndeksi = (aktifOneriIndeksi - 1 + oneriler.length) % oneriler.length;
            oneriler[aktifOneriIndeksi].classList.add('aktif-oneri');
            aramaKutusu.value = byd_verileri[parseInt(oneriler[aktifOneriIndeksi].dataset.veriIndeksi)].soru;

        } else if (e.key === 'Enter') {
            if (aktifOneriIndeksi > -1) {
                e.preventDefault(); 
                
                const secilenItem = oneriler[aktifOneriIndeksi];
                const veriIndeksi = parseInt(secilenItem.dataset.veriIndeksi);
                
                onerilerDiv.innerHTML = '';
                aktifOneriIndeksi = -1;
                gosterSonuclari(byd_verileri[veriIndeksi]);
            }
        }
    });
    
    // Kutudan çıkıldığında önerileri gizle
    aramaKutusu.addEventListener('blur', function() {
        setTimeout(() => {
            onerilerDiv.innerHTML = '';
            aktifOneriIndeksi = -1;
        }, 150); 
    });

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker kaydı başarılı. Kapsam:', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker kaydı başarısız:', error);
            });
    });
}