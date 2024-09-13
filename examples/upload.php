<?php

$targetFile = __DIR__ . "/sample.pdf";
function result($ok, $message): void {
    echo json_encode(array(
        "ok" => $ok,
        "statusText"=> $message
    ));
}

if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    result(ok: false, message:"Error uploading file");
} else if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
    result(ok: true, message: "PDF file uploaded successfully!");
} else {
    result(ok: false, message:"File upload failed");
}

?>