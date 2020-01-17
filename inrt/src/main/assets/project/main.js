auto.waitFor();

const autoPackage = 'com.stardust.auojs.inrt';
const package = 'com.jingdong.app.mall';

function openApp(package) {
  app.launch(package);
}

function killApp(package, timeout, delay) {
  toastLog('停止应用中...');

  timeout = timeout || 10000;
  delay = delay || 1000;

  let ele = delayCheck(
    timeout,
    delay,
    () => {
      openAppSetting(package);
    },
    () => {
      return textContains('FORCE STOP').findOnce() || textContains('Force stop').findOnce() || textContains('强制停止').findOnce();
    }
  );

  if (!ele) {
    throw new Error('无法停止应用, exit');
  }
  ele.click();
  sleep(1000);

  ele = textContains('OK').findOnce() || textContains('确定').findOnce();
  if (ele) {
    ele.click();
  }
  sleep(3000);
}

function retryRun(runFn, killFn, retryLimit) {
  for (let i = 0; i < retryLimit; i += 1) {
    try {
      runFn();
      toastLog('run success');
      return true;
    } catch (e) {
      toastLog('get error: ', i, e.message);
      sleep(1000);

      killFn();
    }
  }
}

function delayCheck(timeout, delay, runFn, checkFn) {
  while (timeout > 0) {
    timeout -= delay;
    runFn();
    let result = checkFn();
    if (result) {
      return result;
    }

    sleep(delay);
  }

  return false;
}


function goToActivity() {
  const ele = descContains('浮层icon').findOnce()
  if (ele) {
    toastLog('进入活动页面中...');
    click(ele.bounds().centerX(), ele.bounds().centerY());
  }
}

function isInTask() {
  if (textContains('加购商品').findOnce()) {
    return true;
  }

  const uiObj = textContains('做任务拿爆竹').findOnce();

  if (uiObj) {
    uiObj.click();
    sleep(3000);
    return !!textContains('加购商品').findOnce();
  }

  return false;
}

function getTaskCount(text) {
  if (!/(\d+)\/(\d+)/.test(text)) {
    throw new Error('未找到任务数');
  }

  const completed = parseInt('' + RegExp.$1);
  const total = parseInt('' + RegExp.$2);
  const left = total - completed;

  return {
    total: total,
    completed: completed,
    left: left,
  };
}

function runTaskDetail() {

}

function runTask(taskPrefix) {
  if (!isInTask()) {
    throw new Error('不再任务界面');
  }

  const uiObj = textContains(taskPrefix).findOnce();
  if (!uiObj) {
    throw new Error('未找到任务详情: ' + taskPrefix);
  }
  const taskDetailEle = uiObj.findOne(textContains('/'));

  if (!taskDetailEle) {
    throw new Error('未找到任务详情: ' + taskPrefix);
  }

  const taskName = taskDetailEle.text();
  const taskCount = getTaskCount(taskName);
  toastLog(taskPrefix + ' 任务: ' + taskName, taskCount);

  if (taskCount.left === 0) {
    return;
  }

  click(device.width - uiObj.bounds().left, uiObj.bounds().top);
  // 等待页面渲染
  sleep(2000);
  // 任务详细处理方法
  runTaskDetail();

  back();
  sleep(1000);

  runTask(taskPrefix);
}

function run() {
  toastLog('打开京东中....');
  openApp(autoPackage);
  sleep(1000);
  openApp(package);
  sleep(1000);
  let current = currentPackage();
  if (package === current) {
    toastLog('进入京东...');
  }
  else {
    throw new Error('进入京东失败')
  }
  const isSuccess = delayCheck(10000, 1000, goToActivity, function() {
    return textContains('加购商品').findOnce() || textContains('做任务拿爆竹').findOnce()
  });

  if (!isSuccess) {
    throw new Error('运行失败!!!');
  }
  toastLog('进入活动界面');
  runTask('加购精选好物');
  runTask('逛逛好店');
  runTask('逛逛热卖会场');
  runTask('参加好玩互动');
  runTask('看京品推荐');
}

retryRun(run, function() {
  killApp(package, 10000, 1000);
}, 3);

killApp(package, 10000, 1000);
