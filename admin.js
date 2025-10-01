// admin.js içinde tinymce.init bloğu
tinymce.init({
    selector: 'cevap', 
    license_key: 'gpl', // Lisans anahtarını buraya taşıdık
    plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
    auto_focus: false, 
    toolbar: 'undo redo |  bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | forecolor backcolor | removeformat | help',
    height: 300,
    promotion: false, // Ek ayar olarak bunu eklemek faydalı olabilir
    content_css: false  // Ek ayar olarak bunu eklemek faydalı olabilir
});



document.getElementById('veriFormu').addEventListener('submit', function(e) {
    e.preventDefault(); // Formun normal submit işlemini durdur

    const durumMesaji = document.getElementById('durumMesaji');
    durumMesaji.style.display = 'none';

    // 1. Formdan verileri topla
    const yeniKayit = {
        soru: document.getElementById('soru').value.trim(),
        
        // KRİTİK GÜNCELLEME: TinyMCE içeriğini alıyoruz.
        cevap: tinymce.get('cevap').getContent().trim(), 
        kategori: document.getElementById('kategori').value.trim(),
        etiketler: document.getElementById('etiketler').value.trim(), 
        foto: document.getElementById('foto').value.trim(),
        video: document.getElementById('video').value.trim(),
        belge: document.getElementById('belge').value.trim()
    };
    
    // Eksik alan kontrolü (sadece required olanlar için)
    if (!yeniKayit.soru || !yeniKayit.cevap || !yeniKayit.kategori || !yeniKayit.etiketler) {
        gosterMesaj(false, "Soru, Cevap, Kategori ve Etiketler alanları boş bırakılamaz.");
        return;
    }

    // 2. Veriyi sunucuya (PHP betiğine) gönder
    fetch('save_data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(yeniKayit)
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200 && result.body.success) {
            gosterMesaj(true, `Kayıt başarıyla eklendi! Yeni Versiyon: ${result.body.new_version}`);
            // Başarılı kayıttan sonra formu temizle
            document.getElementById('veriFormu').reset();
        } else {
            gosterMesaj(false, `Kaydetme Hatası (${result.status}): ${result.body.message || 'Bilinmeyen Hata'}`);
        }
    })
    .catch(error => {
        console.error('Fetch hatası:', error);
        gosterMesaj(false, 'Sunucuya bağlanılamadı veya ağ hatası oluştu.');
    });
});

// Durum mesajını gösterme fonksiyonu
function gosterMesaj(basarili, mesaj) {
    const durumMesaji = document.getElementById('durumMesaji');
    durumMesaji.textContent = mesaj;
    durumMesaji.className = basarili ? 'success' : 'error';
    durumMesaji.style.display = 'block';
}