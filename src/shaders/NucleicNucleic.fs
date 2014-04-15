precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSamplerMat;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform int uWindow;
uniform float uMax;
uniform float uMin;
uniform vec2 uSizes;

void main() {
    vec2 onePixel = 1.0 / uSizes;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    if (
        vTexCoord.x > (uSizes.x - float(uWindow - 1)) * onePixel.x ||
        vTexCoord.y > (uSizes.y - float(uWindow - 1)) * onePixel.y
    ) {
        discard;
    } else {
        for (int i = 0; i != -1; i++) {
            if (i == uWindow) {
                break;
            }
            color += vec4(texture2D(uSamplerMat, vec2(
                texture2D(
                    uSampler1, vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy
                ).r,
                texture2D(
                    uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx
                ).r
            )).rrr / float(uWindow), 1.0);
        }
    }
    if (color.r > uMax) {
        color = vec4(1.0, 1.0, 1.0, 1.0);
    }
    if (color.r < uMin) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    }
    if (color.r >= uMin && color.r <= uMax) {
        color = color * (uMax - uMin) + uMin;
    }
    //FIXME when uMax < uMin
    gl_FragColor = color;
}
