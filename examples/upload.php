<?php

$targetFile = __DIR__ . "/sample.pdf";
function result($ok, $message): void {
    echo json_encode(array(
        "ok" => $ok,
        "statusText"=> $message
    ));
}

try {
    $input = file_get_contents(filename: "php://input");
    $file = fopen(filename: $targetFile, mode: "wb");
    if ($file == false) {
        result(ok: false, message: "File upload failed: cannot open file on server");
        return;
    }
    fwrite(stream: $file, data: $input);
    fclose(stream: $file);
    result(ok: true, message: "PDF file uploaded successfully!");
} catch(Exception $e) {
    result(ok: false, message:"File upload failed: " . $e->getMessage());
}

?>