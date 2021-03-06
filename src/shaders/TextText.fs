precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform int uWindow;
uniform vec2 uTransfer;
uniform vec2 uSizes;

void main() {
    float value;
    vec2 onePixel = 1.0 / uSizes;
    if (
        vTexCoord.x > (uSizes.x - float(uWindow)) * onePixel.x ||
        vTexCoord.y > (uSizes.y - float(uWindow)) * onePixel.y ||
        vTexCoord.x < (float(uWindow)) * onePixel.x ||
        vTexCoord.y < (float(uWindow)) * onePixel.y
    ) {
        discard;
    }
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    if (
        texture2D(uSampler1, vTexCoord.xy).r ==
        texture2D(uSampler2, vTexCoord.yx).r
    ) {
        color = vec4(1.0, 1.0, 1.0, 1.0);
    }
    for (int i = 0; i != -1; i++) {
        if (i == uWindow) {
            break;
        }
        if (
            texture2D(uSampler1, vTexCoord.xy - float(i + 1 - uWindow) * onePixel.xy).r ==
            texture2D(uSampler2, vTexCoord.yx - float(i + 1 - uWindow) * onePixel.yx).r
        ) {
            color += vec4(1.0, 1.0, 1.0, 1.0);
        }
        if (
            texture2D(uSampler1, vTexCoord.xy + float(i + 1 - uWindow) * onePixel.xy).r ==
            texture2D(uSampler2, vTexCoord.yx + float(i + 1 - uWindow) * onePixel.yx).r
        ) {
            color += vec4(1.0, 1.0, 1.0, 1.0);
        }
    }
    gl_FragColor = uTransfer[0] * color / float(uWindow * 2 + 1) + uTransfer[1];
}
