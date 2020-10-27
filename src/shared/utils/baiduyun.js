export async function getFilePath(subUrl, code) {
  const verify = JSON.parse(await (await fetch(`https://pan.baidu.com/share/verify?surl=${subUrl}&channel=chunlei&web=1&app_id=250528&clienttype=0&pwd=${code}`, {
    method: "POST",
    body: `pwd=${code}&vcode=&vcode_str=`,
    credentials: 'omit',
    headers: {
      'User-Agent': 'netdisk',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': 'https://pan.baidu.com/',
      'Cookie': ''
    },
  })).text())

  if (verify.errno === 0) {
    const randsk = verify.randsk
    if (randsk !== 1) {
      const file = await (await fetch(`https://pan.baidu.com/s/1${subUrl}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'netdisk',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': 'https://pan.baidu.com/',
          'Cookie': `BDCLND=${randsk}`
        }
      })).text()

      console.log(file)

      let json = file.match(/yunData.setData\((\{.*?\})\);/)[1]
      json = JSON.parse(json)
      json['randsk'] = randsk
      return json;
    }
  }

  return {
    code: 1,
    msg: '提取码失败或文件不存在！'
  }
}

export async function getDownloadAddress({fs_id, timestamp, sign, randsk, share_id, uk, share, pwd}) {
  return (await (await fetch(`https://pan.kdbaidu.com/?download`, {
    method: "POST",
    body: `fs_id=${fs_id}&timestamp=${timestamp}&sign=${sign}&randsk=${randsk}&share_id=${share_id}&uk=${uk}&share=${share}&pwd=${pwd}`,
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  })).text()).match(/(https)(.+?)(CookieBDUSS)/)[0]
}
