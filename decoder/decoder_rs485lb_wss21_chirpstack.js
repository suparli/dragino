function decodeUplink(input) {
    return { 
        data: Decode(input.fPort, input.bytes, input.variables)
    };   
}

function extractFloatFromBytesRange(bytes, startIndex, endIndex, sensor, isLittleEndian = false) {
    const length = endIndex - startIndex + 1;

    if (length !== 2) {
        throw new Error("Panjang data harus 2 byte untuk integer 16-bit. Saat ini: " + length);
    }

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    for (let i = 0; i < 2; i++) {
        view.setUint8(i, bytes[startIndex + i]);
    }
  
    let value;
  
    // WSS-01 mengirimkan data curah hujan dalam format unsigned integer dengan resolusi 0.1 mm
    if (sensor === 'rain_daily') {    
        value = view.getUint16(0, isLittleEndian);
        return value / 10; // Satuan mm
    }
    else if (sensor === 'rain_last_query') {
        value = view.getUint16(0, isLittleEndian);
        return value / 10; // Satuan mm
    }
    // Opsi bawaan Anda sebelumnya jika ingin digabungkan
    else if (sensor === 'temp' || sensor === 'soil') {
        value = view.getUint16(0, isLittleEndian);
        return value / 10;
    }
    else if (sensor === 'ec') {
        value = view.getUint16(0, isLittleEndian);
        return value / 1000;
    }
    
    return null;
}

function Decode(fPort, bytes, variables) {
    // RS485-LB Status Decode  
    if (fPort === 5) {
        let freq_band;
        let sub_band;
        let sensor_model = "UNKNOWN";
        
        if (bytes[0] === 0x30) {
            sensor_model = "RS485-LB";
        }
          
        let firm_ver = (bytes[1] & 0x0f) + '.' + (bytes[2] >> 4 & 0x0f) + '.' + (bytes[2] & 0x0f);
          
        if (bytes[3] === 0x01) freq_band = "EU868";
        else if (bytes[3] === 0x02) freq_band = "US915";
        else if (bytes[3] === 0x03) freq_band = "IN865";
        else if (bytes[3] === 0x04) freq_band = "AU915";
        else if (bytes[3] === 0x05) freq_band = "KZ865";
        else if (bytes[3] === 0x06) freq_band = "RU864";
        else if (bytes[3] === 0x07) freq_band = "AS923";
        else if (bytes[3] === 0x08) freq_band = "AS923_1";
        else if (bytes[3] === 0x09) freq_band = "AS923_2";
        else if (bytes[3] === 0x0A) freq_band = "AS923_3";
        else if (bytes[3] === 0x0F) freq_band = "AS923_4";
        else if (bytes[3] === 0x0B) freq_band = "CN470";
        else if (bytes[3] === 0x0C) freq_band = "EU433";
        else if (bytes[3] === 0x0D) freq_band = "KR920";
        else if (bytes[3] === 0x0E) freq_band = "MA869";
        
        if (bytes[4] === 0xff) {
            sub_band = "NULL";
        } else {
            sub_band = bytes[4];
        }

        let bat = (bytes[5] << 8 | bytes[6]) / 1000;
        
        return {
            SENSOR_MODEL: sensor_model,
            FIRMWARE_VERSION: firm_ver,
            FREQUENCY_BAND: freq_band,
            SUB_BAND: sub_band,
            BAT: bat,
        };
    }
    else {  
        // Memastikan payload memiliki panjang minimal 7 byte (3 byte bawaan Dragino + 4 byte potongan WSS-01)
        if (bytes.length < 7) {
            return { error: "Payload terlalu pendek untuk pemrosesan WSS-01" };
        }

        let decode = {};
        
        // 3 Byte bawaan dari header RS485-LB
        decode.EXTI_Trigger = (bytes[0] & 0x80) ? "TRUE" : "FALSE";    
        decode.BatV = ((bytes[0] << 8 | bytes[1]) & 0x7FFF) / 1000;
        decode.Payver = bytes[2];
        decode.Node_type = "RS485-LB (WSS-01 Rain Gauge)";

        // 4 Byte hasil potongan (DATACUT) dari balasan Modbus WSS-01
        // Byte 3 dan 4 adalah Register 0 (Curah Hujan Harian)
        decode.Rainfall_Daily_mm = extractFloatFromBytesRange(bytes, 3, 4, 'rain_daily');
        
        // Byte 5 dan 6 adalah Register 1 (Hujan Sejak Kueri Terakhir)
        decode.Rainfall_Last_Query_mm = extractFloatFromBytesRange(bytes, 5, 6, 'rain_last_query');

        return decode;
    }
}