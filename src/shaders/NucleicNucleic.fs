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

float calc(bool reverse, int index) {
    float channel = 0.0;
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
    }
    return channel /= float(uWindow);
}

void main() {
    if (
        vTexCoord.x > (uSizes.x - float(uWindow - 1)) * onePixel.x ||
        vTexCoord.y > (uSizes.y - float(uWindow - 1)) * onePixel.y
    ) {
        discard;
    }
    gl_FragColor = vec4(
    //fixme !
        uTransfer[0] * ((uColors.r == 1) ? calc(false, 0) : 0.0) + uTransfer[1],
        uTransfer[0] * ((uColors.g == 1) ? calc(true, 1) : 0.0) + uTransfer[1],
        uTransfer[0] * ((uColors.b == 1) ? calc(true, 2) : 0.0) + uTransfer[1],
        1.0
    );
}
