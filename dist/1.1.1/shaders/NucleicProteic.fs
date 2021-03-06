precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSamplerMat;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform int uWindow;
uniform vec2 uTransfer;
uniform vec2 uOffset;
uniform ivec3 uColors;
uniform vec2 uSizes;
vec2 onePixel = 1.0 / uSizes;

float rf0() {
    float channel = texture2D(uSamplerMat, vec2(
        texture2D(
            uSampler1, vTexCoord.xy
        ).r,
        texture2D(
            uSampler2, vTexCoord.yx
        ).r * uOffset[1] + uOffset[0]
    )).r;
    for (int i = 0; i != -1; i++) {
        if (i == uWindow) {
            break;
        }
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy
            ).r,
            texture2D(
                uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy + float(i + 1 - uWindow) * onePixel.xy
            ).r,
            texture2D(
                uSampler2, vTexCoord.yx + float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
    }
    return channel /= float(uWindow * 2 + 1);
}

float rf1() {
    float channel = texture2D(uSamplerMat, vec2(
        texture2D(
            uSampler1, vTexCoord.xy
        ).g,
        texture2D(
            uSampler2, vTexCoord.yx
        ).r * uOffset[1] + uOffset[0]
    )).r;
    for (int i = 0; i != -1; i++) {
        if (i == uWindow) {
            break;
        }
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy
            ).g,
            texture2D(
                uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy + float(i + 1 - uWindow) * onePixel.xy
            ).g,
            texture2D(
                uSampler2, vTexCoord.yx + float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
    }
    return channel /= float(uWindow * 2 + 1);
}

float rf2() {
    float channel = texture2D(uSamplerMat, vec2(
        texture2D(
            uSampler1, vTexCoord.xy
        ).b,
        texture2D(
            uSampler2, vTexCoord.yx
        ).r * uOffset[1] + uOffset[0]
    )).r;
    for (int i = 0; i != -1; i++) {
        if (i == uWindow) {
            break;
        }
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy
            ).b,
            texture2D(
                uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
        channel += texture2D(uSamplerMat, vec2(
            texture2D(
                uSampler1, vTexCoord.xy + float(i + 1 - uWindow) * onePixel.xy
            ).b,
            texture2D(
                uSampler2, vTexCoord.yx + float(i + 1 - uWindow) * onePixel.yx
            ).r * uOffset[1] + uOffset[0]
        )).r;
    }
    return channel /= float(uWindow * 2 + 1);
}

void main() {
    if (
        vTexCoord.x > (uSizes.x - float(uWindow)) * onePixel.x ||
        vTexCoord.y > (uSizes.y - float(uWindow)) * onePixel.y ||
        vTexCoord.x < (float(uWindow)) * onePixel.x ||
        vTexCoord.y < (float(uWindow)) * onePixel.y
    ) {
        discard;
    }
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    if ( uColors.r == 1) {
      color[0] = uTransfer[0] * rf0() + uTransfer[1];
    }
    if ( uColors.g == 1) {
      color[1] = uTransfer[0] * rf1() + uTransfer[1];
    }
    if ( uColors.b == 1) {
      color[2] = uTransfer[0] * rf2() + uTransfer[1];
    }
    
    gl_FragColor = color;
}
