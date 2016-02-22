varying vec3 vecPos;

void main() {
    vecPos = position;
    vecPos.z = vecPos.z+1.0;
    gl_Position = vec4(vecPos, 1.0);
}
