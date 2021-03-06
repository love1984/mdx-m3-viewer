uniform mat4 u_mvp;

attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec4 a_color;

varying vec2 v_uv;
varying vec4 v_color;

void main() {
  v_uv = a_uv;
  v_color = a_color;
  
  gl_Position = u_mvp * vec4(a_position, 1);
}
