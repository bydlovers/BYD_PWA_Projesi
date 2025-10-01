<?php
// GÜVENLİK NOTU: BU BETİK, JSON DOSYASINA YAZMA YETKİSİ VERİR. 
// Gerçek projelerde bu betiğe erişimi şifre/oturum kontrolü ile kısıtlamanız ŞİDDETLE ÖNERİLİR.

// 1. Gelen JSON verisini al
$gelen_veri = file_get_contents('php://input');
$yeni_veri_objesi = json_decode($gelen_veri, true);

// Veri gelip gelmediğini kontrol et
if (!$yeni_veri_objesi) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Geçersiz JSON verisi alındı."]);
    exit;
}

// 2. data.json dosyasını oku
$dosya_yolu = 'data.json';
if (!file_exists($dosya_yolu)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "data.json dosyası bulunamadı."]);
    exit;
}

$mevcut_json = file_get_contents($dosya_yolu);
$mevcut_veri = json_decode($mevcut_json, true);

// 3. Yeni veriyi mevcut verilere ekle ve versiyonu güncelle
$yeni_kayit = $yeni_veri_objesi;

// Etiketler alanını string'e çevir (array bekliyorsak)
if (isset($yeni_kayit['etiketler']) && is_string($yeni_kayit['etiketler'])) {
    $yeni_kayit['etiketler'] = array_map('trim', explode(',', $yeni_kayit['etiketler']));
}

// Yeni kaydı en üste ekle (en son eklenen en başta görünür)
array_unshift($mevcut_veri['veriler'], $yeni_kayit);

// Versiyon numarasını artır
$mevcut_veri['versiyon'] = (float)$mevcut_veri['versiyon'] + 0.001;
$mevcut_veri['versiyon'] = number_format($mevcut_veri['versiyon'], 3, '.', '');


// 4. Güncel veriyi data.json dosyasına geri yaz
$guncel_json = json_encode($mevcut_veri, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if (file_put_contents($dosya_yolu, $guncel_json) !== false) {
    echo json_encode(["success" => true, "message" => "Kayıt başarıyla eklendi ve versiyon güncellendi.", "new_version" => $mevcut_veri['versiyon']]);
} else {
    // YAZMA İZNİ HATASI KONTROLÜ
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Dosyaya yazma hatası. data.json dosyasının yazma izinlerini (CHMOD 666) kontrol edin."]);
}

?>