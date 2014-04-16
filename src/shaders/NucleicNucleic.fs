precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSamplerMat;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform int uWindow;
uniform float uMax;
uniform float uMin;
uniform float uOffset;
uniform float uOffsetNext;
uniform int uRed;
uniform int uGreen;
uniform int uBlue;
uniform vec2 uSizes;
vec2 onePixel = 1.0 / uSizes;

float calc(bool reverse) {
    float channel = 0.0;
    for (int i = 0; i != -1; i++) {
            if (i == uWindow) {
                break;
            }
            channel += texture2D(uSamplerMat, vec2(
                texture2D(
                    uSampler1, (reverse) ? (1.0 - (vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy)) : (vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy)
                ).r,
                texture2D(
                    uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx
                ).r * (uOffsetNext - uOffset) + uOffset
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
    float red = (uRed == 1) ? calc(false) : 0.0;
    float green = (uGreen == 1) ? calc(true) : 0.0;
    gl_FragColor = vec4(red / (uMax - uMin) - uMin / (uMax - uMin), green / (uMax - uMin) - uMin / (uMax - uMin), (uBlue == 1) ? 1.0 : 0.0, 1.0);
}
