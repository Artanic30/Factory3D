# 配置文件介绍

### allow_move：
视角是否锁死

### model_path：
模型地址位置，当前支持FBX文件格式

### camera_position：
场景中摄像机位置

### target_position：
场景中摄像机对准的位置

### background：
场景中背景颜色

### status_style：
特殊效果的样式
- opacity: 不透明度
- emissiveIntensity：自发光强度（可用于调节颜色效果）
- edgeStrength： 发光边缘亮度
- edgeThickness：发光边缘厚度
- pulsePeriod： 发光边缘闪动频率（秒）
- edgeGlow：发光边缘发光效果强度
- offline：离线状态1.物体颜色2.发光边缘颜色3.发光边缘被遮挡后颜色
- error: 异常状态
- pending：等待状态

### highlight_style：
鼠标移到物体上的高光效果样式
- color： 高光颜色
- opacity： 不透明度
- emissiveIntensity： 自发光强度（可用于调色）

### card_style：
- height： 铭牌在物体正上方高度
    
### card_update:
传输铭牌内容接口
- event_name： 接受父组件传入数据事件名称
子组件发送请求数据例子
```json
{
  "type": "update_card",
  "payload": {
    "id": ["group78_group70", "group78_group67", "group78_group67"]
  }
}
```
- type: 等于event_name
- id：所有有铭牌物体的名称列表

父组件传入数据例子（需三维代码外实现）
```json
{
  "type": "update_card",
  "payload": {
    "group78_group70": "<div style=\"height: 150px;width: 300px;margin: -10px -10px -20px -10px;background: #f5da55;text-align: center;border: solid red 5px\">\n    <h4 style=\"color: #000; \">Hello world!</h4>\n<h4 style=\"color: #000; \">offline update</h4>\n</div>",
    "group78_group68": "<div style=\"height: 150px;width: 300px;margin: -10px -10px -20px -10px;background: #f5da55;text-align: center;border: solid red 5px\">\n    <h4 style=\"color: #000; \">Hello world!</h4>\n <h4 style=\"color: #000; \">pending update</h4>\n</div>",
    "group78_group67": "<div style=\"height: 150px;width: 300px;margin: -10px -10px -20px -10px;background: #f5da55;text-align: center;border: solid red 5px\">\n    <h4 style=\"color: #000; \">Hello world!</h4>\n <h4 style=\"color: #000; \">error update</h4>\n</div>"
  }
}
```
- type: 等于event_name

### scene_summary
场景内物体数量和所有物体名称（识别符）
- event_name：监听器名称
子组件请求message
```json
{
  "type": "summary",
  "payload": {
    "names": ["group78_group70", "group78_group67", "group78_group67"],
    "amount": 3
  }
}
```
- type: 等于event_name
- amount： 场景中物体总数
- names：场景中物体名字列表

### light_settings：
场景中灯光效果
- point_light： 点光源
- direct_light： 平行光源
- ambient_light： 环境光

具体参数解释参考：https://threejs.org/docs/index.html#api/en/lights/Light

### loaded_callback:
模型完成加载后回调
- event_name： 回调事件名称

### object_settings:
- keys： 模型名称（识别符）
- values：模型配置信息

- is_interactive：是否需要点击互动的物体
- status： 物体状态（可选类型"normal", "error", "pending", "offline"）
- card_html: 物体铭牌初始渲染html字符串（注意最外层的div中style的height和width可以用于改变铭牌大小，不建议修改margin的值，会出现白色边框，其他参数无需特殊注意）
- show_card： 初始是否显示铭牌
- click_actions： 点击事件（可为null，及无点击交互事件）
click_actions具体类型：
1.跳转事件：
- type： 准确等于 "toLink"
- link: 需要跳转的地址
2.展示铭牌事件：
- type： 准确等于 "showCard"
3.改变颜色事件：
- type： 准确等于 "changeColor"
- color： 需要改变物体成为的颜色
4.回调事件：
- type： 准确等于 "callback"
- event_name：监听器名称

点击事件回调事件子组件传出信息例子      
```json
{
  "type": "click_object",
  "payload": {
    "id": "group78_group70"
  }
}
```
- type: 等于event_name
- id： 点击物体的名字

### change_color_outside:
父组件传入物体变色事件
- event_name: 事件传入type名称
传入值例子
```json
{
   "type": "change_color",
   "payload": {
    "id": "004",
     "color": "0xFF00FF"
   }
}
```