"use strict"

import * as THREE from 'three'
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {FXAAShader} from "three/examples/jsm/shaders/FXAAShader";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import html2canvas from 'html2canvas';

const AFRAME = require('aframe');


class Three {
    constructor(config) {
        this.config = config
        this.rootDom = document.createElement('div')
        this.sceneDom = document.createElement('a-scene')
        this.cameraDom = document.createElement('a-camera')

        this.sceneDom.setAttribute("background", {color: this.config.background})
        this.sceneDom.setAttribute('objects', '')
        this.sceneDom.setAttribute('outlineEffects', '')
        this.sceneDom.setAttribute('renderer', {
            colorManagement: true,
        })
        this.sceneDom.setAttribute('vr-mode-ui', {enabled: false})

        this.sceneDom.setAttribute('look-controls', {enabled: false})
        this.cameraDom.setAttribute('look-controls', {enabled: false})
        this.sceneDom.setAttribute('wasd-controls', {enabled: false})
        this.cameraDom.setAttribute('wasd-controls', {enabled: false})

        let light_config = config.light_settings
        light_config.point_light.map(con => {
            let light_dom = document.createElement('a-light')
            light_dom.setAttribute('type', 'point')
            light_dom.setAttribute('color', parseInt(con.color, 16))
            light_dom.setAttribute("position", `${con.position.x} ${con.position.y} ${con.position.z}`)
            light_dom.setAttribute('decay', con.decay)
            light_dom.setAttribute('ground-color', parseInt(con.ground_color, 16))
            light_dom.setAttribute('intensity', con.intensity)

            this.sceneDom.appendChild(light_dom)
        })

        light_config.direct_light.map(con => {
            let light_dom = document.createElement('a-light')
            light_dom.setAttribute('color', parseInt(con.color, 16))
            light_dom.setAttribute("position", `${con.position.x} ${con.position.y} ${con.position.z}`)
            light_dom.setAttribute('intensity', con.intensity)
            light_dom.setAttribute('angle', con.angle)

            this.sceneDom.appendChild(light_dom)
        })

        let ambient_color = light_config.ambient_light.color
        let light_dom = document.createElement('a-light')
        light_dom.setAttribute('type', 'ambient')
        light_dom.setAttribute('color', parseInt(ambient_color, 16))
        light_dom.setAttribute('intensity', light_config.ambient_light.intensity)
        this.sceneDom.appendChild(light_dom)

        document.body.append(this.rootDom)
        this.rootDom.appendChild(this.sceneDom)
        this.sceneDom.appendChild(this.cameraDom)


        let cls_inst = this
        AFRAME.registerSystem('outlineEffects', {
            /**
             * Configure composer with a few arbitrary passes.
             */
            init: function () {
                const sceneEl = this.sceneEl;

                if (!sceneEl.hasLoaded) {
                    sceneEl.addEventListener('loaded', this.init.bind(this));
                    return;
                }

                const scene = sceneEl.object3D;
                const renderer = sceneEl.renderer;
                const camera = sceneEl.camera;

                let controller = new OrbitControls(camera, renderer.domElement)

                controller.dampingFactor = 0.05;

                controller.screenSpacePanning = false;

                controller.minDistance = 100;
                controller.maxDistance = 1000;

                controller.maxPolarAngle = Math.PI / 2;

                // init camera settings here
                const camera_position = cls_inst.config.camera_position
                const target_position = cls_inst.config.target_position
                camera.position.set(camera_position.x, camera_position.y, camera_position.z);

                camera.lookAt(new THREE.Vector3(target_position.x, target_position.y, target_position.z))
                controller.target.set(target_position.x, target_position.y, target_position.z);
                controller.update()

                if (!cls_inst.config.allow_move) {
                    controller.enabled = false
                }


                let composer = new EffectComposer(renderer);
                let renderPass = new RenderPass(scene, camera);
                let style_config = cls_inst.config.status_style

                let outlinePassError = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
                outlinePassError.edgeStrength = style_config.edgeStrength
                outlinePassError.edgeThickness = style_config.edgeThickness
                outlinePassError.visibleEdgeColor.set(parseInt(style_config.error.border_color, 16))
                outlinePassError.hiddenEdgeColor.set(parseInt(style_config.error.blocked_border_color, 16))
                outlinePassError.pulsePeriod = style_config.pulsePeriod
                outlinePassError.edgeGlow = style_config.edgeGlow

                let outlinePassOffline = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
                outlinePassOffline.edgeStrength = style_config.edgeStrength
                outlinePassOffline.edgeThickness = style_config.edgeThickness
                outlinePassOffline.visibleEdgeColor.set(parseInt(style_config.offline.border_color, 16))
                outlinePassOffline.hiddenEdgeColor.set(parseInt(style_config.offline.blocked_border_color, 16))
                outlinePassOffline.pulsePeriod = style_config.pulsePeriod
                outlinePassOffline.edgeGlow = style_config.edgeGlow

                let outlinePassPending = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
                outlinePassPending.edgeStrength = style_config.edgeStrength
                outlinePassPending.edgeThickness = style_config.edgeThickness
                outlinePassPending.visibleEdgeColor.set(parseInt(style_config.pending.border_color, 16))
                outlinePassPending.hiddenEdgeColor.set(parseInt(style_config.pending.blocked_border_color, 16))
                outlinePassPending.pulsePeriod = style_config.pulsePeriod
                outlinePassPending.edgeGlow = style_config.edgeGlow




                let effectFXAA = new ShaderPass(FXAAShader);
                effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
                // Order matters!!!!!
                composer.addPass(renderPass)
                composer.addPass(outlinePassError)
                composer.addPass(outlinePassOffline)
                composer.addPass(outlinePassPending)
                composer.addPass(effectFXAA)

                this.composer = composer;

                cls_inst.outlinePassError = outlinePassError
                cls_inst.outlinePassOffline = outlinePassOffline
                cls_inst.outlinePassPending = outlinePassPending


                window.addEventListener('resize', () => {
                    camera.aspect = window.innerWidth / window.innerHeight
                    camera.updateProjectionMatrix()
                    renderer.setSize(window.innerWidth, window.innerHeight)
                    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
                }, false)

                this.bind();
            },

            /**
             * Record the timestamp for the current frame.
             * @param {number} time
             * @param {number} timeDelta
             */
            tick: function (time, timeDelta) {
                this.timeDelta = timeDelta;
            },

            /**
             * Binds the EffectComposer to the A-Frame render loop.
             * (This is the hacky bit.)
             */
            bind: function () {
                const renderer = this.sceneEl.renderer;
                const render = renderer.render;
                const system = this;
                let isDigest = false;

                renderer.setPixelRatio(window.devicePixelRatio)
                renderer.setSize(window.innerWidth, window.innerHeight)

                renderer.render = function () {
                    if (isDigest) {
                        render.apply(this, arguments);
                    } else {
                        isDigest = true;
                        system.composer.render(system.timeDelta);
                        isDigest = false;
                    }
                };
            }
        });


        AFRAME.registerComponent('objects', {
            dependencies: ['outlineEffects'],
            schema: {
                interactiveObjects: {
                    type: "array",
                    "default": []
                },
                pointedObjected: {
                    type: "array",
                    "default": []
                },
                rayCaster: {
                    type: "array",
                    "default": null
                },
                originalMaterial: {
                    type: "array",
                    "default": []
                },
                current_sprites: {
                    type: "array",
                    "default": []
                }
            },
            init_mesh (mesh, object_config, object_names) {
                let mesh_id = mesh.name
                if (!object_config.hasOwnProperty(mesh_id)) {
                    console.error(`object ${mesh_id} doesn't have configuration`)
                    return
                }
                let mesh_config = object_config[mesh_id]
                if (mesh_config.is_interactive) {
                    // add object to interactive objects
                    this.data.interactiveObjects.push(mesh)
                    mesh.castShadow = true

                    // checking if object has special status
                    this.status_effect(mesh, mesh_config.status)

                    // activate default sprite
                    this.open_sprite(mesh, mesh_config.show_card)

                    object_names.push(mesh_id)
                    this.sum_object += 1
                }
            },
            decode_group(item, object_config, object_names) {
                if (item instanceof THREE.Mesh) {
                    this.init_mesh(item, object_config, object_names)
                } else if (item instanceof THREE.Group) {
                    item.children.map( child => {
                        this.decode_group(child, object_config, object_names)
                    })
                }
            },
            init: function () {
                let data = this.data;
                let scene = this.el.sceneEl.object3D;
                const loader = new FBXLoader();

                data.pointedObject = null;
                data.interactiveObjects = [];
                // load model files
                loader.load(cls_inst.config.model_path, obj => {
                    scene.add(obj);
                    // object group contains all the meshes


                    let object_names = []

                    this.sum_object = 0
                    let object_config = cls_inst.config.object_settings

                    this.decode_group(obj, object_config, object_names)
                    // let re = ''
                    // let html_template = `<div style=\\"height: 150px;width: 300px;margin: -10px -10px -10px -10px;background: #f5da55;text-align: center;border: solid red 5px\\">    <h4 style=\\"color: #000; \\">Hello world!</h4><h4 style=\\"color: #000; \\">template</h4></div>`
                    // object_names.map(name => {
                    //     re += `"${name}": {\n "is_interactive": true,\n "status": "normal",\n "card_html": "${html_template}", \n"show_card": false, \n"click_actions": null\n},\n`
                    // })
                    // console.log(re)
                    // debugger

                    let summary_config = cls_inst.config.scene_summary
                    window.parent.postMessage({
                        type: summary_config.event_name,
                        payload: {
                            names: object_names,
                            amount: this.sum_object
                        }
                    }, "*")

                    let update_card = cls_inst.config.card_update
                    let color_config = cls_inst.config.change_color_outside
                    window.addEventListener("message", res => {
                        if (res.data.type === update_card.event_name) {
                            let spr_data = res.data.payload
                            if (spr_data) {
                                data.current_sprites.map(spr => {
                                    if (spr_data.hasOwnProperty(spr.name)) {
                                        let iframe=document.createElement('iframe');
                                        document.body.appendChild(iframe);
                                        let iframeDoc=iframe.contentDocument||iframe.contentWindow.document;
                                        iframeDoc.body.innerHTML=spr_data[spr.name];
                                        html2canvas(iframeDoc.body).then(canvas => {
                                            document.body.removeChild(iframe);
                                            const texture = new THREE.CanvasTexture(canvas)
                                            texture.minFilter = THREE.LinearFilter
                                            texture.needsUpdate = false
                                            spr.material.map = texture
                                        });
                                    }
                                })
                            }
                        } else if (res.data.type === color_config.event_name) {
                            let click_data = res.data.payload
                            if (click_data) {
                                let obj_name = click_data.id
                                let obj_color = click_data.color
                                let obj_mesh = null
                                data.interactiveObjects.map(obj => {
                                    if (obj.name === obj_name) {
                                        obj_mesh = obj
                                    }
                                })
                                if (!obj_mesh) {
                                    console.error(`mesh with given id ${obj_name} not found!`)
                                    return
                                }

                                if (obj_mesh.material instanceof THREE.Material) {
                                    if (data.pointedObject === obj_mesh) {
                                        this.highlight_effect(obj_mesh, -1)
                                    }
                                    let mate = obj_mesh.material
                                    let new_material = new THREE.MeshPhongMaterial({
                                        color: parseInt(obj_color, 16),
                                        map: mate.map,
                                        name: mate.name,
                                        transparent: true,
                                        emissive: mate.color,
                                        emissiveIntensity: mate.emissiveIntensity,
                                        opacity: mate.opacity
                                    })

                                    obj_mesh.material = new_material
                                    if (data.pointedObject === obj_mesh) {
                                        this.highlight_effect(obj_mesh, 1)
                                    }
                                } else {
                                    if (data.pointedObject === obj_mesh) {
                                        this.highlight_effect(obj_mesh, -1)
                                    }
                                    let new_materials = []
                                    obj_mesh.material.map(mate => {
                                        let new_material = new THREE.MeshPhongMaterial({
                                            color: parseInt(obj_color, 16),
                                            map: mate.map,
                                            name: mate.name,
                                            transparent: true,
                                            emissive: mate.color,
                                            emissiveIntensity: mate.emissiveIntensity,
                                            opacity: mate.opacity
                                        })
                                        new_materials.push(new_material)
                                    })

                                    obj_mesh.material = new_materials
                                    if (data.pointedObject === obj_mesh) {

                                        this.highlight_effect(obj_mesh, 1)
                                    }
                                }
                            }
                        }
                    })

                    // init rayCaster
                    data.rayCaster = new THREE.Raycaster;

                    this.el.addEventListener('mousemove', mouse => {
                        // this part only monitor the mouse move and update the ray where mouse-camera is pointing at.
                        let cam = this.el.sceneEl.camera;
                        let rayCaster = data.rayCaster;
                        let rect = this.el.sceneEl.canvas.getBoundingClientRect();
                        let mo = new THREE.Vector2;
                        mo.x = mouse.x / (rect.right - rect.left) * 2 - 1;
                        mo.y = -(mouse.y / (rect.bottom - rect.top)) * 2 + 1;
                        rayCaster.setFromCamera(mo, cam);
                    }, false);

                    // init click callback
                    this.el.addEventListener('click', e => {
                        e.preventDefault()
                        let pointedObject = data.pointedObject;
                        if (!pointedObject) {
                            return
                        }
                        let action_config = cls_inst.config.object_settings;
                        if (!action_config.hasOwnProperty(pointedObject.name)) {
                            console.error(`no config found for ${pointedObject.name}`)
                            return
                        }
                        let object_config = action_config[pointedObject.name].click_actions
                        if (object_config) {
                            if (object_config.type !== "showCard" && pointedObject.sprite) {
                                this.open_sprite(pointedObject, null)
                            }
                            switch (object_config.type) {
                                case "toLink":
                                    if (!object_config.link) {
                                        console.error("config file format error in click_actions!")
                                        return
                                    }
                                    window.location.href = object_config.link
                                    break
                                case "showCard":
                                    this.open_sprite(pointedObject, null)
                                    break
                                case "changeColor":
                                    if (!object_config.color) {
                                        console.error("config file format error in click_actions!")
                                        return
                                    }
                                    // console.log(Array.isArray(pointedObject.material), pointedObject.material instanceof THREE.Material)
                                    // console.log(pointedObject.material, pointedObject, typeof pointedObject.material)
                                    // debugger
                                    if (pointedObject.material instanceof THREE.Material) {
                                        let mate = pointedObject.material
                                        let new_material = new THREE.MeshPhongMaterial({
                                            color: parseInt(object_config.color, 16),
                                            map: mate.map,
                                            name: mate.name,
                                            transparent: true,
                                            emissive: mate.color,
                                            emissiveIntensity: mate.emissiveIntensity,
                                            opacity: mate.opacity
                                        })
                                        this.data.originalMaterial = new_material
                                        pointedObject.material = new_material
                                    } else {
                                        let new_materials = []
                                        pointedObject.material.map(mate => {
                                            let new_material = new THREE.MeshPhongMaterial({
                                                color: parseInt(object_config.color, 16),
                                                map: mate.map,
                                                name: mate.name,
                                                transparent: true,
                                                emissive: mate.color,
                                                emissiveIntensity: mate.emissiveIntensity,
                                                opacity: mate.opacity
                                            })
                                            new_materials.push(new_material)
                                        })
                                        this.data.originalMaterial = new_materials
                                        pointedObject.material = new_materials
                                    }
                                    break
                                case "callback":
                                    if (!object_config.event_name) {
                                        console.error("config file format error in click_actions!")
                                        return
                                    }
                                    window.parent.postMessage({
                                        type: object_config.event_name,
                                        payload: {
                                            id: pointedObject.name
                                        }
                                    }, "*")
                                    break
                            }
                        }
                        console.log(pointedObject)
                    })

                    let loaded_config = cls_inst.config.loaded_callback
                    window.parent.postMessage({
                        type: loaded_config.event_name,
                        payload: {
                            info: "objects loaded!"
                        }
                    }, "*")
                })
            },
            status_effect(object, type) {
                let effect_config = cls_inst.config.status_style
                let new_materials = []
                let color = null
                let outlinePass = null
                switch (type) {
                    case 'offline':
                        color = parseInt(effect_config.offline.color, 16)
                        outlinePass = cls_inst.outlinePassOffline
                        break
                    case 'error':
                        color = parseInt(effect_config.error.color, 16)
                        outlinePass = cls_inst.outlinePassError
                        break
                    case 'pending':
                        color = parseInt(effect_config.pending.color, 16)
                        outlinePass = cls_inst.outlinePassPending
                        break
                    case "normal":
                        return
                }

                // add outline
                if (outlinePass) {
                    outlinePass.selectedObjects.push(object)
                } else {
                    console.error("no matching type for status!")
                }

                object.material.map(mate => {
                    let new_material = new THREE.MeshPhongMaterial({
                        color: color,
                        map: mate.map,
                        emissive: color,
                        emissiveIntensity: effect_config.emissiveIntensity,
                        name: mate.name,
                        transparent: true,
                        opacity: effect_config.opacity
                    })
                    new_materials.push(new_material)
                })
                object.material = new_materials

            },
            open_sprite(object, default_visible) {
                if (object) {
                    let obj_config = cls_inst.config.object_settings
                    if (!obj_config.hasOwnProperty(object.name)) {
                        console.error(`no config found for ${object.name}`)
                        return
                    }
                    let html_string = obj_config[object.name].card_html
                    if (!html_string) {
                        return
                    }
                    if (object.sprite) {
                        object.sprite.visible = !object.sprite.visible
                        return
                    }
                    let iframe=document.createElement('iframe');
                    document.body.appendChild(iframe);
                    let iframeDoc=iframe.contentDocument||iframe.contentWindow.document;
                    iframeDoc.body.innerHTML=html_string;
                    html2canvas(iframeDoc.body).then(canvas => {
                        document.body.removeChild(iframe);
                        const texture = new THREE.CanvasTexture(canvas)
                        texture.minFilter = THREE.LinearFilter
                        texture.needsUpdate = false
                        const material = new THREE.SpriteMaterial( { map: texture } );
                        const sprite = new THREE.Sprite( material );
                        sprite.scale.set(canvas.width, canvas.height, 0)
                        sprite.name = object.name
                        sprite.position.set(object.position.x, object.position.y + cls_inst.config.card_style.height, object.position.z)
                        object.sprite = sprite
                        sprite.visible = default_visible
                        this.data.current_sprites.push(sprite)
                        object.parent.add(sprite)
                    });
                }
            },
            highlight_effect(object, isAdd) {
                let highlight_style = cls_inst.config.highlight_style
                if (object) {
                    if (isAdd === 1) {

                        // define highlight material here
                        if (object.material instanceof THREE.Material) {
                            let mate = object.material
                            let new_material = new THREE.MeshPhongMaterial({
                                color: parseInt(highlight_style.color, 16),
                                map: mate.map,
                                name: mate.name,
                                transparent: true,
                                emissive: parseInt(highlight_style.color, 16),
                                emissiveIntensity: highlight_style.emissiveIntensity,
                                opacity: highlight_style.opacity
                            })
                            this.data.originalMaterial = object.material
                            object.material = new_material
                        } else {
                            let highlight_materials = []
                            object.material.map(mate => {
                                let new_material = new THREE.MeshPhongMaterial({
                                    color: parseInt(highlight_style.color, 16),
                                    map: mate.map,
                                    name: mate.name,
                                    transparent: true,
                                    emissive: parseInt(highlight_style.color, 16),
                                    emissiveIntensity: highlight_style.emissiveIntensity,
                                    opacity: highlight_style.opacity
                                })
                                highlight_materials.push(new_material)
                            })
                            this.data.originalMaterial = object.material
                            object.material = highlight_materials
                        }


                    } else {
                        if (this.data.originalMaterial) {
                            object.material = this.data.originalMaterial
                        }
                    }

                }
            },
            tick: function (time, timeDelta) {
                let data = this.data;
                let rayCaster = data.rayCaster;
                let exhibitObjects = data.interactiveObjects;
                this.timeDelta = timeDelta


                if (exhibitObjects.length !== 0) {
                    let intersects = rayCaster.intersectObjects(exhibitObjects);
                    if (intersects.length !== 0) {
                        // find the closest exhibit object
                        let closeIntersect = intersects[0];
                        for (let i = 1; i < intersects.length; i++) {
                            if (closeIntersect.distance > intersects[i].distance) {
                                closeIntersect = intersects[i];
                            }
                        }
                        // process the closest exhibit object intersects
                        let closeObject = closeIntersect.object;

                        // deal with the current pointed object
                        if (closeObject !== data.pointedObject) {
                            this.highlight_effect(data.pointedObject, -1)
                            this.highlight_effect(closeObject, 1)

                            data.pointedObject = closeObject;
                        }
                    } else {
                        // focus move out of object from a object
                        if (data.pointedObject) {
                            this.highlight_effect(data.pointedObject, -1)
                        }
                        data.pointedObject = null;
                    }
                }
            }
        });

    }
}

fetch("./config_jixie.json")
    .then(response => response.json())
    .then(json => {
        let three = new Three(json)
    });

