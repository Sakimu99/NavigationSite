window.SITE_CONFIG = {
  brandName: 'Sakimu',
  title: 'Sakimu 导航站',
  subtitle: '一个简单的入口页，用来放博客、工具和其他常用链接。',
  quickLinks: [
    {
      title: '博客',
      description: '记录文章和日常更新。',
      url: 'https://blog.sakimu.com',
      badge: '内容'
    },
    {
      title: '工具页',
      description: '放常用工具和实验页面。',
      url: '/tools',
      badge: '工具'
    },
    {
      title: '投喂页',
      description: '放赞助方式和支持说明。',
      url: '/donate',
      badge: '支持'
    }
  ],
  tools: [
    {
      title: 'JSON 格式化',
      description: '示例工具位。你可以替换成自己的在线工具地址。',
      url: '#',
      badge: '待接入'
    },
    {
      title: '正则测试',
      description: '适合放常用开发工具、在线测试页面或实验功能。',
      url: '#',
      badge: '待接入'
    },
    {
      title: '编码转换',
      description: '可以替换为 Base64、URL Encode 或文本处理工具。',
      url: '#',
      badge: '待接入'
    },
    {
      title: '站点状态',
      description: '也可以放监控面板、服务状态页或公开仪表盘入口。',
      url: '#',
      badge: '可扩展'
    }
  ],
  donations: [
    {
      title: '支付宝',
      description: '用于展示支付宝收款码和支持说明。',
      actionLabel: '查看收款码',
      url: '/donate#alipay',
      badge: '唯一方式'
    }
  ]
};
