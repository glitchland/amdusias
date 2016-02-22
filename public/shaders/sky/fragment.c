precision mediump float;
uniform highp float uTime;
uniform vec2 uRes;

void main(void) {
        float scale = 0.01;
        float time = uTime * 100.0;
        float r1 = 0.4 ;
        float r2 = 0.9 ;
        float r3 = 0.29;
        float x = gl_FragCoord.x;
        float y = gl_FragCoord.y;
        float h = uRes.y;
        float w = uRes.x;


        float col =
        sin(distance( vec2(x * r1 + time, y * r2), vec2(w / r3 , h) ) * scale) +
        sin(distance( vec2(x, y * r2), vec2(1.0 / h * r3, w * r1) ) * scale) +
        sin(distance( vec2(r3 * x + time, r1 * y + time), vec2(w * r2 + h * r1, h * r2) ) * scale) +
        sin(distance( vec2(1.0 / x * r3 , y * r2), vec2(h, w) ) * scale);

        vec3 color = vec3( 0.5 + 0.5 * sin(col), cos(col), cos(col) - sin(col)) + 0.1;
        color += mod(gl_FragCoord.x, 2.0) < 1.0 ? 0.0 : 0.4;

        gl_FragColor = vec4(color,  1.0);
}
