function decodeUplink(input) {
        return { 
            data: Decode(input.fPort, input.bytes, input.variables)
        };   
}

function extractFloatFromBytesRange(bytes, startIndex, endIndex,  sensor, isLittleEndian = false) {
    const length = endIndex - startIndex + 1;

    if (length !== 2) {
        throw new Error("Panjang data harus 2 byte untuk float16. Saat ini: " + length);
    }

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    for (let i = 0; i < 2; i++) {
        view.setUint8(i, bytes[startIndex + i]);
    }
  
  if (sensor == 'temp'){	
		value = view.getUint16(0, isLittleEndian);
        return value / 10;
     
    }
	else if (sensor == 'soil'){
      value = view.getUint16(0, isLittleEndian);
        return value / 10;
	}
  	else if (sensor == 'ec'){
	 value = view.getUint16(0, isLittleEndian);
        return value / 1000;
	}
    
}



function Decode(fPort, bytes, variables) {
//RS485-LB Decode  
  if(fPort==5)
  {
  	var freq_band;
  	var sub_band;
    var sensor;
    
    if(bytes[0]==0x30)
      sensor= "RS485-LB";
      
	  var firm_ver= (bytes[1]&0x0f)+'.'+(bytes[2]>>4&0x0f)+'.'+(bytes[2]&0x0f);
	  
    if(bytes[3]==0x01)
        freq_band="EU868";
  	else if(bytes[3]==0x02)
        freq_band="US915";
  	else if(bytes[3]==0x03)
        freq_band="IN865";
  	else if(bytes[3]==0x04)
        freq_band="AU915";
  	else if(bytes[3]==0x05)
        freq_band="KZ865";
  	else if(bytes[3]==0x06)
        freq_band="RU864";
  	else if(bytes[3]==0x07)
        freq_band="AS923";
  	else if(bytes[3]==0x08)
        freq_band="AS923_1";
  	else if(bytes[3]==0x09)
        freq_band="AS923_2";
  	else if(bytes[3]==0x0A)
        freq_band="AS923_3";
  	else if(bytes[3]==0x0F)
        freq_band="AS923_4";
  	else if(bytes[3]==0x0B)
        freq_band="CN470";
  	else if(bytes[3]==0x0C)
        freq_band="EU433";
  	else if(bytes[3]==0x0D)
        freq_band="KR920";
  	else if(bytes[3]==0x0E)
        freq_band="MA869";
  	
    if(bytes[4]==0xff)
      sub_band="NULL";
	  else
      sub_band=bytes[4];

    var bat= (bytes[5]<<8 | bytes[6])/1000;
    
  	return {
  	  SENSOR_MODEL:sensor,
      FIRMWARE_VERSION:firm_ver,
      FREQUENCY_BAND:freq_band,
      SUB_BAND:sub_band,
      BAT:bat,
  	}
  }
  else
  {  
    var decode = {};
    decode.EXTI_Trigger= (bytes[0] & 0x80)? "TRUE":"FALSE";    
    decode.BatV= ((bytes[0]<<8 | bytes[1])&0x7FFF)/1000;
    decode.Payver= bytes[2];
    decode.Node_type="RS485-LB";
    decode.Sensor_Temp = extractFloatFromBytesRange(bytes, 3, 4,'temp');
    decode.Sensor_Soil = extractFloatFromBytesRange(bytes, 5, 6,'soil');
	decode.Sensor_EC = extractFloatFromBytesRange(bytes, 7, 8,'ec');



    return decode;
  }
}