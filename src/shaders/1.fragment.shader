precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSamplerMat;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform int uWindow;
uniform vec2 uSizes;

void main() {
    vec2 onePixel = 1.0 / uSizes;

    /*for (int i = 0; i != -1; i++) {
        if (i == uWindow) {
            break;
        }
        color += (texture2D(uSampler1, vec2(vTexCoord.x - float(i + 1 - uWindow)*onePixel.x, vTexCoord.y - float(i + 1 - uWindow)*onePixel.y)) / float(uWindow));
//        color += (texture2D(uSampler1, vec2(vTexCoord.x - float(i - 1 + uWindow)*onePixel.x, vTexCoord.y - float(i)*onePixel.y)) / float(uWindow));
    }*/
    vec4 color = vec4(texture2D(uSamplerMat, vec2(
        texture2D(uSampler1, vTexCoord).r,
        texture2D(uSampler2, vTexCoord).r
    )).rrr, 1.0);
    gl_FragColor = color;
}
