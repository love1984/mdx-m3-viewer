# Copyright (c) 2013 Chananya Freiman (aka GhostWolf)

require "./glsl_min"

USE_CLOSURE = true

MDX_SHADERS = [
  "vssoftskinning",
  "vshardskinningarray",
  "vshardskinningtexture",
  "vsparticles",
  "psmain",
  "psparticles"
]

M3_SHADERS = [
  "vscommon",
  "vsstandard",
  "pscommon",
  "psstandard",
  "psspecialized",
  "vsparticles",
  "psparticles"
]

SHARED_SHADERS = [
  "vsbonetexture",
  "vsworld",
  "vswhite",
  "psworld",
  "pswhite"
]

CODE_FILES = [
  "math/before",
  "math/math",
  "math/vec3",
  "math/vec4",
  "math/quaternion",
  "math/mat4",
  "math/interpolator",
  "math/after",
  "binaryreader/binaryreader",
  "base",
  "gl",
  "url",
  "viewer/before",
  "viewer/shaders",
  "viewer/shadermap",
  "viewer/mdx/before",
  "viewer/mdx/parser",
  "viewer/mdx/tracks",
  "viewer/mdx/skeleton",
  "viewer/mdx/collisionshape",
  "viewer/mdx/model",
  "viewer/mdx/texture",
  "viewer/mdx/geoset",
  "viewer/mdx/layer",
  "viewer/mdx/particle",
  "viewer/mdx/particleemitter",
  "viewer/mdx/particle2",
  "viewer/mdx/particleemitter2",
  "viewer/mdx/ribbon",
  "viewer/mdx/ribbonemitter",
  "viewer/mdx/after",
  "viewer/m3/before",
  "viewer/m3/parser",
  "viewer/m3/sd",
  "viewer/m3/sts",
  "viewer/m3/stc",
  "viewer/m3/stg",
  "viewer/m3/skeleton",
  "viewer/m3/boundingshape",
  "viewer/m3/region",
  "viewer/m3/layer",
  "viewer/m3/standardmaterial",
  "viewer/m3/model",
  #"viewer/m3/particle",
  #"viewer/m3/particleemitter",
  "viewer/m3/after",
  "viewer/after"
]

def handle_shaders(shared, mdx, m3, srcpath, outputs)
  names = shared + mdx.map { |p| "w" + p } + m3.map { |p| "s" + p }
  paths = shared.map { |p| srcpath + "sharedshaders/" + p + ".c" } + mdx.map { |p| srcpath + "mdx/shaders/" + p + ".c" } + m3.map { |p| srcpath + "m3/shaders/" + p + ".c" }
  minified = minify_files(paths , true)
  shaders = []
  
  names.each_index { |i|
    shaders.push("\"#{names[i]}\":\"#{minified[0][i]}\"")
  }
  
  File.open(srcpath + "shaders.js", "w") { |output|
    output.write("// Copyright (c) 2013 Chananya Freiman (aka GhostWolf)\n\nvar SHADERS = {\n\t#{shaders.join(",\n\t")}\n};")
  }

  File.open(srcpath + "shadermap.js", "w") { |output|
    output.write("// Copyright (c) 2013 Chananya Freiman (aka GhostWolf)\n\nvar PARAMETERMAP = {\n\t")
    output.write(minified[1].to_a().collect { |v| "\"#{v[0]}\":\"#{v[1]}\"" }.join(",\n\t"))
    output.write("\n};\n\nvar MEMBERMAP = {\n\t")
    output.write(minified[2].to_a().collect { |v| "\"#{v[0]}\":\"#{v[1]}\"" }.join(",\n\t"))
    output.write("\n};")
  }
end

def handle_source(paths, use_closure, output)
    File.open("model_viewer_monolith.js", "w") { |output|
      output.write("(function(){")
      output.write("\"use strict\";")
      
      paths.each { |file|
        output.write(IO.read("src/" + file + ".js") + "\n")
      }
      
      output.write("}());")
    }
	
    if use_closure
      system("java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js model_viewer_monolith.js --js_output_file model_viewer_monolith_min.js");
    else
      File.open("model_viewer_monolith_min.js", "w") { |output|
        File.open("model_viewer_monolith.js", "r") { |input|
          output.write(input.read())
        }
      }
	end
  
    File.open("model_viewer_monolith_min.js", "r") { |input|
      File.open(output, "w") { |output|
        output.write("// Copyright (c) 2013 Chananya Freiman (aka GhostWolf)\n")
        
        if use_closure
          output.write("(function(){")
          output.write("\"use strict\";")
        end
        
        output.write(input.read().gsub("// Copyright (c) 2013 Chananya Freiman (aka GhostWolf)", ""))
        
        if USE_CLOSURE
          output.write("}());")
        end
        
      }
    }

    File.delete("model_viewer_monolith.js")
    File.delete("model_viewer_monolith_min.js")
end

handle_shaders(SHARED_SHADERS, MDX_SHADERS, M3_SHADERS, "src/viewer/", ["shaders.js", "shadermap.js", "membermap.js"])
handle_source(CODE_FILES, USE_CLOSURE, "viewer.js")
