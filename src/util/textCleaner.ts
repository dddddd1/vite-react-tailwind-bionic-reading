// 文本净化工具函数

// 清除HTML标签
export const removeHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '');
};

// 清除多余空格（包括多个连续空格、制表符等）
export const removeExtraSpaces = (text: string): string => {
  // 先替换制表符和其他空白字符为普通空格
  let result = text.replace(/[\t\f\v]/g, ' ');
  // 替换多个连续空格为单个空格
  result = result.replace(/ {2,}/g, ' ');
  // 清除行首和行尾的空格
  result = result.replace(/^ +| +$/gm, '');
  return result;
};

// 统一换行规则（将不同操作系统的换行符统一为\n）
export const normalizeLineBreaks = (text: string): string => {
  // 替换\r\n（Windows）和\r（Mac旧版）为\n
  return text.replace(/\r\n|\r/g, '\n');
};

// 清除多余换行（将3个或更多连续换行替换为2个）
export const removeExtraLineBreaks = (text: string): string => {
  return text.replace(/\n{3,}/g, '\n\n');
};

// 清除乱码（保留常见的字符集）
export const removeGarbledText = (text: string): string => {
  // 保留字母、数字、常见标点、中文字符、换行符和空格
  // 注意：这个正则表达式可能需要根据实际情况调整
  return text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?;:'"()\[\]{}<>\-+*/=@#$%^&_~`|\\]/g, '');
};

// 统一段落缩进（每个段落开头添加2个空格）
export const addParagraphIndentation = (text: string): string => {
  // 先统一换行符
  let result = normalizeLineBreaks(text);
  // 清除多余换行
  result = removeExtraLineBreaks(result);
  // 为每个非空行的开头添加2个空格
  result = result.replace(/^(?!\s*$)/gm, '  ');
  return result;
};

// 完整的文本净化函数
export const cleanText = (text: string): string => {
  let result = text;
  
  // 1. 清除HTML标签
  result = removeHtmlTags(result);
  
  // 2. 统一换行符
  result = normalizeLineBreaks(result);
  
  // 3. 清除乱码
  result = removeGarbledText(result);
  
  // 4. 清除多余空格
  result = removeExtraSpaces(result);
  
  // 5. 清除多余换行
  result = removeExtraLineBreaks(result);
  
  // 6. 统一段落缩进
  result = addParagraphIndentation(result);
  
  return result.trim();
};
